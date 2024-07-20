# Repogenie

Repogenie is a Node.js package that automates the creation of a new React project and initializes a Git repository. It supports creating projects using Create React App (CRA) or Next.js and optionally sets up a GitHub repository.

## Features

- Create a new React project using Create React App or Next.js.
- Initialize a Git repository and make the initial commit.
- Optionally create and push to a GitHub repository.
- Support for various Next.js setup options.

## Installation

Install the package globally using npm:

```bash
npm install -g repogenie
```

## Setting up

Set your github username:

```bash
export GITHUB_USERNAME="your_github_username"
```

Set your github token:

```bash
export GITHUB_TOKEN="your_github_token"
```

## Starting a new project

Type the following in your CLI after installing the packackage globally

```bash
repogenie <project_name>
```
