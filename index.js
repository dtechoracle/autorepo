import { Command } from 'commander';
import { execa } from 'execa';

const program = new Command();

program
  .version('1.0.0')
  .description('Create a new React project and GitHub repository')
  .arguments('<projectName>')
  .action(async (projectName) => {
    try {
      // Check if terminal is authenticated
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        console.log('Please authenticate in the terminal before proceeding.');
        return;
      }

      // Create React project
      console.log('Creating React project...');
      console.log('Working on it...');
      await execa('npm', ['init', 'react-app', projectName, '--template', 'vite']);
      console.log('Project created successfully.');

      // Initialize Git repository
      console.log('Initializing Git repository...');
      await execa('git', ['init'], { cwd: projectName });

      // Create GitHub repository
      console.log('Creating GitHub repository...');
      await execa('gh', ['repo', 'create', projectName]);
      console.log('Repo created successfully.');

      console.log('React project and GitHub repository created successfully.');
    } catch (error) {
      console.error('Error occurred:', error);
    }
  });

program.parse(process.argv);

async function checkAuthentication() {
  try {
    await execa('gh', ['auth', 'status']);
    return true; // Terminal is authenticated
  } catch (error) {
    return false; // Terminal is not authenticated
  }
}
