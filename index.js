#!/usr/bin/env node
import { Command } from "commander";
import { execa } from "execa";
import axios from "axios";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";

const program = new Command();

program
  .version("1.0.0")
  .description("Create a new React project and Git repository")
  .arguments("<projectName>")
  .action(async (projectName) => {
    try {
      // Prompt user to select template
      const { template } = await inquirer.prompt([
        {
          type: "list",
          name: "template",
          message: "Choose a template:",
          choices: ["CRA (Create React App)", "Next.js"],
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

      // Add and commit initial files to the repository
      console.log("Adding and committing initial files...");
      await execa("git", ["add", "."]);
      await execa("git", ["commit", "-m", "Initial commit"]);
      console.log("Initial files added and committed.");

      console.log("React project created and Git repository initialized.");

      // Optionally, create repository on GitHub
      const { createRepo } = await inquirer.prompt([
        {
          type: "confirm",
          name: "createRepo",
          message: "Do you want to create a GitHub repository?",
          default: false,
        },
      ]);

      if (createRepo) {
        // Detect GitHub username and token from environment variables
        const gitUsername = process.env.GITHUB_USERNAME;
        const gitToken = process.env.GITHUB_TOKEN;

        if (!gitUsername || !gitToken) {
          console.error("Error: GitHub username or token is not set.");
          process.exit(1);
        }

        console.log("GitHub username:", gitUsername);

        // Create repository on GitHub
        console.log("Creating repository on GitHub...");
        const response = await axios.post(
          "https://api.github.com/user/repos",
          {
            name: projectName,
            private: false, // Change to true if you want a private repository
          },
          {
            headers: {
              Authorization: `token ${gitToken}`,
              Accept: "application/vnd.github.v3+json",
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

          // Create 'main' branch locally if it doesn't exist
          console.log("Creating local main branch...");
          await execa("git", ["branch", "-M", "main"]);
          console.log("Local main branch created.");

          // Push to GitHub
          console.log("Pushing to GitHub...");
          await execa("git", ["push", "-u", "origin", "main"]);
          console.log("Pushed to GitHub successfully.");
        } else {
          console.log("Failed to create repository on GitHub.");
        }
      } else {
        console.log("No GitHub repository created.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  });

program.parse(process.argv);
