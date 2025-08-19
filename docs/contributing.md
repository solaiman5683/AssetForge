# Contributing to AssetForge

Thank you for your interest in contributing to AssetForge! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment](#development-environment)
4. [Branching Strategy](#branching-strategy)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)
9. [Feature Requests](#feature-requests)
10. [Bug Reports](#bug-reports)
11. [Project Structure](#project-structure)

## Code of Conduct

Please be respectful and inclusive in your interactions with other contributors. We aim to foster an open and welcoming environment.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AssetForge.git
   cd AssetForge
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/solaiman5683/AssetForge.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Environment

### Requirements

- Node.js >= 18
- npm >= 7

### Editor Configuration

We recommend using Visual Studio Code with the following extensions:

- ESLint
- Prettier
- EditorConfig for VS Code

### Running the Project Locally

```bash
# Run CLI commands
node src/cli.js --help

# Run the UI
node src/ui/server.js
```

### Running Tests

```bash
npm test
```

## Branching Strategy

- `main`: Stable release branch
- `develop`: Development branch
- Feature branches: `feature/your-feature-name`
- Bug fix branches: `fix/issue-description`
- Release branches: `release/x.y.z`

Always create your feature/fix branches from `develop`.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and automated changelogs:

- `feat: add new feature`
- `fix: resolve issue`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code restructuring`
- `perf: performance improvements`
- `test: add or modify tests`
- `chore: routine tasks, dependencies`

## Pull Request Process

1. **Update your fork** with the latest changes:

   ```bash
   git fetch upstream
   git checkout develop
   git merge upstream/develop
   ```

2. **Create a new branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them with descriptive messages

4. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a pull request** to the `develop` branch with:

   - Clear description of changes
   - Any relevant issue numbers
   - Screenshots if applicable

6. **Respond to feedback** from maintainers during the review process

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for high test coverage
- Test your changes manually

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/image.test.js
```

## Documentation

When adding or changing functionality:

- Update relevant documentation in the `/docs` directory
- Add JSDoc comments to your code
- Update the README.md if necessary
- Document any new command-line options

## Feature Requests

When proposing new features:

1. First check if the feature has already been requested or implemented
2. Open an issue describing:
   - The problem your feature solves
   - How your implementation would work
   - Any alternatives you've considered

## Bug Reports

When reporting bugs:

1. Check if the issue has already been reported
2. Include:
   - AssetForge version
   - Node.js version
   - Operating system
   - Exact steps to reproduce
   - Expected vs. actual behavior
   - Sample files if possible

## Project Structure

Understanding the project structure will help you make effective contributions:

```
/
├── docs/               # Documentation files
├── scripts/            # Utility and build scripts
├── src/
│   ├── cli.js          # Command-line interface
│   ├── config.js       # Configuration handling
│   ├── index.js        # Main entry point for API
│   ├── processors/     # Asset processors
│   │   ├── audio.js    # Audio processing
│   │   ├── image.js    # Image processing
│   │   ├── json.js     # JSON tools
│   │   ├── pdf.js      # PDF processing
│   │   └── svg.js      # SVG optimization
│   ├── ui/             # Web interface
│   │   ├── app.js      # UI application logic
│   │   ├── debug.html  # Debug page
│   │   ├── debug.js    # Debug scripts
│   │   ├── index.html  # Main UI page
│   │   └── server.js   # UI web server
│   └── utils/          # Shared utilities
│       ├── spinner.js  # CLI spinner
│       └── watermark.js # Watermark generation
├── tests/              # Test files
└── tmp/                # Temporary files (gitignored)
```

## Code Style

We follow standard JavaScript practices with ES Modules:

- Use ES modules (`import`/`export`)
- Follow ESLint rules
- Use async/await for asynchronous code
- Write clear, concise code with helpful comments

## Development Process

1. **Implementing a new processor**:

   - Add a new file in `src/processors/`
   - Export the processor functions in `src/index.js`
   - Add CLI commands in `src/cli.js`
   - Add UI support in `src/ui/server.js` if applicable
   - Write tests in `tests/`
   - Update documentation

2. **Modifying an existing processor**:
   - Maintain backward compatibility when possible
   - Add tests for new functionality
   - Update relevant documentation

## Dependencies

- Be careful when adding new dependencies
- Prefer well-maintained, secure libraries
- Consider bundle size impact
- Document why a dependency is needed

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have any questions about contributing, please open an issue with the "question" label.

Thank you for contributing to AssetForge!
