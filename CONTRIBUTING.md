# Contributing to Minerva

## General Onboarding

In addition to the steps outlined in this page, it is recommended that you go through the steps in the [Minerva Developer Onboarding Guide](https://docs.google.com/document/d/1Ln9ldKIFPOmMxLfW3iFzAfW-HCECqbwqHC7oJxRYEqo/edit#heading=h.140h72nwd7xz)

_Note that this guide is currently not updated for the Minerva Rewrite and therefore can be ignored_

## Setting Up Your Environment

### NodeJS

Minerva uses NodeJS, a JavaScript runtime environment. You can download it [here](https://nodejs.org/en)

Minerva is currently using Node v18, and it is recommended that you use the same.

### Yarn

The Minerva codebase uses Yarn v2 as its package manageer, which provides significant benefits over the default, `npm`. You do not have to install Yarn on your machine as modern versions of NodeJS come installed with [corepack](https://nodejs.org/api/corepack.html), which takes care of the installation process for any non-standard package manager that a project may have. Corepack is currently experimental, so you will need to run `corepack enable` to enable it.

If you come from `npm`, some commands may not be what you expect them to be, e.g. the `yarn` equivalent of `npm install [package]` is `yarn add [package]`, and `yarn install` just installs all of the project dependencies. It is recommended that you take a quick look through an [npm vs Yarn commands cheat sheet](https://www.digitalocean.com/community/tutorials/nodejs-npm-yarn-cheatsheet) to re-familiarize yourself.

As we are using Yarn, do not use `npm install` to install new node packages. If you do so, delete `package-lock.json` and the `node_modules` folder that it creates and you should be good to go.

### Cloning the Repo and Installing Dependencies

To get started, you will first need to clone the repository to your local machine and install required dependencies:

```sh
git clone git@github.com:waterloo-rocketry/minerva-rewrite.git
cd minerva-rewrite
corepack enable # Set up Yarn
yarn install
```

### (VSCode Users) Setting up VSCode for development

If you use Visual Studio Code as your IDE, this codebase provides recommended extensions that will be useful in developing Minerva. When you first open the codebase, you should be prompted to install the extensions recommended by this project by a pop-up. If this does not appear, go to the extensions tab, search for `@recommended`, and install the extensions that show up.

To allow the TypeScript extension to work with Yarn for things such as dependency resolution, you will need to specify the TypeScript version that Yarn provides. If you have the extension installed, upon opening the repository using VSCode you will be notified that "This workspace contains a TypeScript version" and asked if you would "like to use the workspace TypeScript version". Click on "Allow" and VSCode will get this set up for you. If such a message does not pop up, open any `.ts` file in the repo, open up your command palette (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>) and run the "TypeScript: Select TypeScript version..." command. From here, select "Use Workspace Version".

## Contributing Code

### Taking Issues

The best way to get started on contributing to Minerva is to take on an issue. Simply go to the [issues page](https://github.com/waterloo-rocketry/minerva-rewrite/issues) and find an issue that may interest you. Some issues may be lacking context or background info so it might be a good idea to ask a fellow Minerva developer on specifics if required. Once you've found an issue that you would like to work on, then set yourself as the issue's assignee and once ready, change the status of the issue in the linked project from "Todo" to "In Progress".

### Creating Branches

The repo follows the branch naming convention of `{name}/{issue_num}-{description}`, e.g. `cwijesek/10-flesh-out-readme`

- `{name}` is the part of the branch name that identifies its author. The recommended identifier is the author's WatIAM username (the combination of your first intial, possibly some numbers, and the first few letters of your last name that comes before `@uwaterloo.ca` in your email).
- `{issue_num}` is the issue number of the issue that you are trying to fix or implement. If this branch is not associated with an issue, then you do not need to specify anything for this (e.g., just `cwijesek/flesh-out-readme` is fine)
- `{description}` is a short description of what this branch is fixing/implementing. Be sure to keep it short, as good practice is to keep the entire branch name under 30-40 characters.

### Formatting and Linting Your Code

To ensure that the code that you write is formatted well and adheres to our style guide, be sure to format it and ensure that no errors or warnings are being displayed by the linter. If you are using VSCode and have [installed the recommended extensions](#vscode-users-installing-recommended-extensions), then Prettier and ESLint should take care of this for you. If you do not use VSCode, or want to run linting/formatting manually, then you can simply run `yarn run format`.

### Unit Testing your Code

To test your code using our test suite, simply run `yarn test`. If the tests pass then you are good to go! If they fail, then you may need to either fix your code or modify the failing unit tests to work with the new code that you wrote. Note that whenever you write new code for Minerva, you should write new tests and modify old tests to ensure that the codebase is well-tested

Alternatively, you can test your code by simply committing and pushing your code. Whenever new code is pushed, a GitHub Actions workflow will run all unit tests against this code.

### Deploying to a Development Environment

Minerva's functionality can be tested before it is deployed to production by deploying it to our development Slack environment, which you can gain access to by following the steps outlined in the [Minerva Developer Onboarding Guide](https://docs.google.com/document/d/1Ln9ldKIFPOmMxLfW3iFzAfW-HCECqbwqHC7oJxRYEqo/edit#heading=h.140h72nwd7xz).
Before making your deployment, ensure that others are not currently using the development environment for their own testing, as only one instance of Minerva can be deployed at a time. Deploying to Dev can be done by running the `yarn run deploy-dev` command, which will force-push your code to the `development` branch. When code is pushed to this branch, a GitHub Actions workflow will build and deploy your code. If this workflow fails, you might have issues in your code that you will need to fix before trying again.

Once the application has been deployed to development, you should test Minerva's functionality in the Development Slack. Ensure that not only your new functionality works as intended, but also that existing functionality still works.

### Publishing PRs

When you have written up your code and are ready to get it reviewed, merged to `main`, and deployed to production, then you can [open a PR for your branch](https://github.com/waterloo-rocketry/minerva-rewrite/compare). Here's a few things that you should make sure to do when creating your PR:

- All branches being merged to `main` must pass all their unit tests and successfully deploy to the Minerva development environment. If you have not done so yet, ensure that all unit tests pass and deploy to dev by running `yarn run deploy-dev`.
- Assign yourself as the assignee for the PR.
- Assign the `minerva-reviewers` Team as a reviewer for your PR. This will assign everyone working on Minerva as a reviewer to the PR and is good for keeping everyone in the loop about what's going on. Additionally, if desired, assign others as reviewers to the PR if you want them specifically to review it or if the reviewer is not in the `minerva-reviewers` team.
- Make sure to link the PR to the relevant issue, if possible. The easiest way is [by using keywords in the PR description](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword), e.g. you can link the PR to Issue 103 by writing "closes #103" somewhere in the description.
- Since your task is now in a review state, make sure to move the project status of the issue that this PR is linked to from "In Progress" to "Needs Review". If this project is not linked to an issue, add the PR to the "Software Master Project" Project and set its status accordingly.

### Merging PRs

Once your PR has passed all unit tests, been successfully deployed to the dev environment, and has been reviewed and approved, you can merge it to `main`. Merge using the "Squash and Merge" option so that all the commits from your branch are "squashed" into one commit containing all the changes. Once your branch is merged, GitHub Actions will automatically deploy the new changes into production. [Monitor the status of the deploy](https://github.com/waterloo-rocketry/minerva/actions/workflows/deploy_production.yml) while this is happening in case the job fails and the application needs to be fixed.
