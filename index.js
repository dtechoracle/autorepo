`#!/usr/bin/env node`
import { Command } from 'commander';
import { execa } from 'execa';
import axios from 'axios';
import inquirer from 'inquirer';

const program = new Command();

program
  .version('1.0.0')
  .description('Create a new React project and Git repository')
  .arguments('<projectName>')
  .action(async (projectName) => {
    try {
      // Prompt user to select template
      const { template } = await inquirer.prompt([
        {
          type: 'list',
          name: 'template',
          message: 'Choose a template:',
          choices: ['CRA (Create React App)', 'Next.js'],
        },
      ]);
      
      console.log(`Selected template: ${template}`);

      // Install the selected template
      console.log(`Creating ${template} project...`);
      if (template === 'CRA (Create React App)') {
        await execa('npx', ['create-react-app', projectName]);
      } else if (template === 'Next.js') {
        const { options } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'options',
            message: 'Select options:',
            choices: [
              { name: 'typescript', checked: false },
              { name: 'tailwindcss', checked: false },
              { name: 'srcDir', checked: false },
              { name: 'appRouter', checked: true },
              { name: 'customizeAlias', checked: true },
            ],
          },
        ]);
        console.log('Selected options:', options);
        const args = options.flatMap(option => [`--${option}`]);
        console.log('Arguments for create-next-app:', args);
        console.log("Getting your project ready :)...");
        const createNextAppProcess = execa('npx', ['create-next-app@12.0.0', projectName, ...args]);
        createNextAppProcess.stdout.pipe(process.stdout);
        createNextAppProcess.stderr.pipe(process.stderr);
        await createNextAppProcess;
      }

      console.log(`${template} project created successfully.`);

      // Initialize Git repository
      console.log('Initializing Git repository...');
      const initGitProcess = execa('git', ['init'], { cwd: projectName });
      initGitProcess.stdout.pipe(process.stdout);
      initGitProcess.stderr.pipe(process.stderr);
      await initGitProcess;

      console.log('Git repository initialized.');

      // Add and commit initial files to the repository
      console.log('Adding and committing initial files...');
      const addFilesProcess = execa('git', ['add', '.'], { cwd: projectName });
      addFilesProcess.stdout.pipe(process.stdout);
      addFilesProcess.stderr.pipe(process.stderr);
      await addFilesProcess;

      const commitProcess = execa('git', ['commit', '-m', 'Initial commit'], { cwd: projectName });
      commitProcess.stdout.pipe(process.stdout);
      commitProcess.stderr.pipe(process.stderr);
      await commitProcess;

      console.log('Initial files added and committed.');

      console.log('React project created and Git repository initialized.');

      // Optionally, create repository on GitHub
      const { createRepo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createRepo',
          message: 'Do you want to create a GitHub repository?',
          default: false,
        },
      ]);

      if (createRepo) {
        // Detect GitHub username
        const { stdout: gitUsername } = await execa('git', ['config', '--get', 'user.username']);
        const { stdout: gitToken } = await execa('git', ['config', '--get', 'user.token']);
        console.log('GitHub username:', gitUsername);
        console.log('GitHub token:', gitToken);

        // Create repository on GitHub
        console.log('Creating repository on GitHub...');
        const response = await axios.post('https://api.github.com/user/repos', {
          name: projectName,
          private: false, // Change to true if you want a private repository
        }, {
          headers: {
            Authorization: `token ${gitToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (response.status === 201) {
          console.log('Repository created on GitHub.');

          // Add GitHub remote
          console.log('Adding GitHub remote...');
          const addRemoteProcess = execa('git', ['remote', 'add', 'origin', response.data.clone_url], { cwd: projectName });
          addRemoteProcess.stdout.pipe(process.stdout);
          addRemoteProcess.stderr.pipe(process.stderr);
          await addRemoteProcess;

          console.log('GitHub remote added.');

          // Create 'main' branch locally if it doesn't exist
          console.log('Creating local main branch...');
          const createMainBranchProcess = execa('git', ['branch', '-M', 'main'], { cwd: projectName });
          createMainBranchProcess.stdout.pipe(process.stdout);
          createMainBranchProcess.stderr.pipe(process.stderr);
          await createMainBranchProcess;
          console.log('Local main branch created.');

          // Push to GitHub
          console.log('Pushing to GitHub...');
          const branchName = response.data.default_branch || 'main'; // Use 'main' as default branch name
          const pushProcess = execa('git', ['push', '-u', 'origin', branchName], { cwd: projectName });
          pushProcess.stdout.pipe(process.stdout);
          pushProcess.stderr.pipe(process.stderr);
          await pushProcess;

          console.log('Pushed to GitHub successfully.');
        } else {
          console.log('Failed to create repository on GitHub.');
        }
      } else {
        console.log('No GitHub repository created.');
      }
    } catch (error) {
      console.error('Error occurred:', error);
    }
  });

program.parse(process.argv);
