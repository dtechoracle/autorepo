#!/usr/bin/env node
import { Command } from "commander";
import { execa } from "execa";
import axios from "axios";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";

const program = new Command();

program
  .version("1.0.2")
  .description("Create a new React project and Git repository with a single command")
  .arguments("<projectName>")
  .action(async (projectName) => {
    try {
      // Prompt user to select template
      const { template } = await inquirer.prompt([
        {
          type: "list",
          name: "template",
          message: "Choose a template:",
          choices: ["CRA (Create React App)", "Vite", "Next.js"],
        },
      ]);

      console.log(`Selected template: ${template}`);

      // Install the selected template
      console.log(`Creating ${template} project...`);
      if (template === "CRA (Create React App)") {
        await execa("npx", ["create-react-app", projectName]);
        
      } else if (template === "Next.js") {
        const { options } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "options",
            message: "Select options:",
            choices: [
              { name: "typescript", checked: false },
              { name: "tailwindcss", checked: false },
              { name: "srcDir", checked: false },
              { name: "appRouter", checked: true },
              { name: "customizeAlias", checked: true },
            ],
          },
        ]);
        console.log("Selected options:", options);
        const args = options.flatMap((option) => [`--${option}`]);
        console.log("Arguments for create-next-app:", args);
        console.log("Getting your project ready :)...");
        const createNextAppProcess = execa("npx", [
          "create-next-app@12.0.0",
          projectName,
          ...args,
        ]);
        createNextAppProcess.stdout.pipe(process.stdout);
        createNextAppProcess.stderr.pipe(process.stderr);
        await createNextAppProcess;
      }

      console.log(`${template} project created successfully.`);

      // Navigate into the project directory
      const projectPath = path.resolve(process.cwd(), projectName);
      process.chdir(projectPath);

      // Initialize Git repository
      console.log("Initializing Git repository...");
      await execa("git", ["init"]);
      console.log("Git repository initialized.");

      // Ensure all project files are created
      const projectFilesExist = fs.existsSync(
        path.join(projectPath, "package.json")
      );
      if (!projectFilesExist) {
        console.error("Project files were not created successfully.");
        process.exit(1);
      }

      // Add and commit initial files to the repository
      console.log("Adding and committing initial files...");
      await execa("git", ["add", "."]);
      await execa("git", ["commit", "-m", "Initial commit"]);
      console.log("Initial files added and committed.");

      // Create 'main' branch locally if it doesn't exist
      console.log("Creating local main branch...");
      await execa("git", ["branch", "-M", "main"]);
      console.log("Local main branch created.");

      // Check if GitHub username and token are set in global Git config
      const gitUsernameResult = await execa("git", [
        "config",
        "--global",
        "user.name",
      ]);
      const gitTokenResult = await execa("git", [
        "config",
        "--global",
        "user.token",
      ]);
      let gitUsername = gitUsernameResult.stdout;
      let gitToken = gitTokenResult.stdout;

      // If username or token are not set, prompt the user to set them
      if (!gitUsername || !gitToken) {
        const { username, token } = await inquirer.prompt([
          {
            type: "input",
            name: "username",
            message: "Enter your GitHub username:",
          },
          {
            type: "password",
            name: "token",
            message: "Enter your GitHub token:",
          },
        ]);

        gitUsername = username;
        gitToken = token;

        // Set the GitHub username and token globally
        await execa("git", ["config", "--global", "user.name", gitUsername]);
        await execa("git", ["config", "--global", "user.token", gitToken]);
      }

      console.log("GitHub username:", gitUsername);

      // Create repository on GitHub
      console.log("Creating repository on GitHub...");
      try {
        const response = await axios.post(
          "https://api.github.com/user/repos",
          {
            name: projectName,
            private: false, // Change to true if you want a private repository
          },
          {
            headers: {
              Authorization: `token ${gitToken}`,
            },
          }
        );

        if (response.status === 201) {
          console.log("Repository created on GitHub.");

          // Add GitHub remote
          console.log("Adding GitHub remote...");
          await execa("git", [
            "remote",
            "add",
            "origin",
            response.data.clone_url,
          ]);
          console.log("GitHub remote added.");

          // Push to GitHub
          console.log("Pushing to GitHub...");
          await execa("git", ["push", "-u", "origin", "main"]);
          console.log("Pushed to GitHub successfully.");
        } else {
          console.log(
            "Failed to create repository on GitHub. Response status:",
            response.status
          );
        }
      } catch (apiError) {
        console.error(
          "GitHub API error:",
          apiError.response ? apiError.response.data : apiError.message
        );
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  });

program.parse(process.argv);
