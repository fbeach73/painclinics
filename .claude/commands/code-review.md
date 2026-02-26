---
description: Review code for security, performance, and quality issues
---

# Code Review Checklist

## Security
- No hardcoded secrets/API keys
- Input validation on all user data
- SQL injection prevention (parameterized queries)

## Performance
- Minimize re-renders (React.memo, useMemo)
- Code splitting/lazy loading for large components
- Optimize images and assets

## Code Quality
- DRY principle
- Clear variable/function names
- Error boundaries in React
- Proper TypeScript types

## Node/React Specific
- Environment variables in .env
- Proper async/await error handling
- Clean up useEffect dependencies