#!/bin/bash

# Read JSON input from stdin
input_data=$(cat)

# Parse JSON with jq - handle both Claude API and GLM structures
model=$(echo "$input_data" | jq -r '.model.display_name // .model // .model_id // "GLM"')

# Try to get context window info (Claude API)
context_size=$(echo "$input_data" | jq -r '.context_window.context_window_size // empty')
input_tokens=$(echo "$input_data" | jq -r '.context_window.current_usage.input_tokens // 0')
cache_creation=$(echo "$input_data" | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')
cache_read=$(echo "$input_data" | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')

# Alternative: Try to get usage from GLM API response fields
if [ "$input_tokens" = "0" ] || [ "$input_tokens" = "null" ]; then
    input_tokens=$(echo "$input_data" | jq -r '.usage.prompt_tokens // .usage.input_tokens // .prompt_tokens // .input_tokens // 0')
    completion_tokens=$(echo "$input_data" | jq -r '.usage.completion_tokens // 0')
    total_tokens=$(echo "$input_data" | jq -r '.usage.total_tokens // 0')

    # For GLM, use total_tokens if available (includes both prompt and completion)
    if [ "$total_tokens" != "0" ] && [ "$total_tokens" != "null" ]; then
        input_tokens=$total_tokens
    fi
fi

# Set context window size based on model if not provided
if [ -z "$context_size" ] || [ "$context_size" = "null" ]; then
    case "$model" in
        *"glm-4"*)
            context_size=128000
            ;;
        *"glm-3"*)
            context_size=128000
            ;;
        *)
            context_size=128000  # Default for GLM
            ;;
    esac
fi

# Get git branch (suppress errors if not in a repo)
git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$git_branch" ]; then
    git_branch="no-git"
fi

# Get project name from current directory
project=$(basename "$PWD")

# ANSI color codes
reset="\033[0m"
cyan="\033[36m"
green="\033[32m"
yellow="\033[33m"
magenta="\033[35m"
blue="\033[34m"
white="\033[97m"
gray="\033[90m"
red="\033[31m"

# Function to format token count as "45k/200k"
format_tokens() {
    local count=$1
    if [ "$count" -ge 1000 ]; then
        echo "$((count / 1000))k"
    else
        echo "$count"
    fi
}

# Calculate current tokens and percentage
current_tokens=$((input_tokens + cache_creation + cache_read))

# Detect if we're using a non-Claude API (z.ai, GLM, etc.)
is_zai=false
if echo "$model" | grep -qiE "(glm|zai|z\.ai|chatglm)"; then
    is_zai=true
fi

if [ "$current_tokens" -gt 0 ] && [ "$context_size" -gt 0 ]; then
    percent_used=$((current_tokens * 100 / context_size))

    # Create 12-character visual bar
    filled=$((percent_used / 8))
    empty=$((12 - filled))
    bar="${white}[${green}$(printf '=%.0s' $(seq 1 $filled 2>/dev/null))${white}$(printf '─%.0s' $(seq 1 $empty 2>/dev/null))]${reset}"

    current_fmt=$(format_tokens $current_tokens)
    total_fmt=$(format_tokens $context_size)

    printf "${cyan}%s${reset} %b ${yellow}%d%%${reset} ${white}|${reset} ${magenta}%s/%s${reset} ${white}|${reset} ${green}%s${reset} ${white}|${reset} ${blue}%s${reset}" \
        "$model" "$bar" "$percent_used" "$current_fmt" "$total_fmt" "$git_branch" "$project"
elif [ "$is_zai" = true ]; then
    # z.ai/GLM doesn't provide real-time token tracking via their API
    # Show context window size with a different indicator
    total_fmt=$(format_tokens $context_size)
    bar="${white}[${gray}?${reset}${white}───────────]${reset}"

    printf "${cyan}%s${reset} %b ${yellow}N/A${reset} ${white}|${reset} ${gray}%s${reset} ${white}|${reset} ${green}%s${reset} ${white}|${reset} ${blue}%s${reset}" \
        "$model" "$bar" "$total_fmt" "$git_branch" "$project"
else
    total_fmt=$(format_tokens $context_size)
    bar="${white}[────────────]${reset}"

    printf "${cyan}%s${reset} %b ${yellow}0%%${reset} ${white}|${reset} ${magenta}0/%s${reset} ${white}|${reset} ${green}%s${reset} ${white}|${reset} ${blue}%s${reset}" \
        "$model" "$bar" "$total_fmt" "$git_branch" "$project"
fi
