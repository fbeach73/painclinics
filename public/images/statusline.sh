#!/bin/bash

# Read JSON input from stdin
input_data=$(cat)

# Parse JSON with jq
model=$(echo "$input_data" | jq -r '.model.display_name')
context_size=$(echo "$input_data" | jq -r '.context_window.context_window_size')
input_tokens=$(echo "$input_data" | jq -r '.context_window.current_usage.input_tokens // 0')
cache_creation=$(echo "$input_data" | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')
cache_read=$(echo "$input_data" | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')

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
else
    total_fmt=$(format_tokens $context_size)
    bar="${white}[────────────]${reset}"

    printf "${cyan}%s${reset} %b ${yellow}0%%${reset} ${white}|${reset} ${magenta}0/%s${reset} ${white}|${reset} ${green}%s${reset} ${white}|${reset} ${blue}%s${reset}" \
        "$model" "$bar" "$total_fmt" "$git_branch" "$project"
fi
