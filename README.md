# Certora IDE

Certora provides security analysis tools for Smart Contracts. Certora has unique technology called Certora Prover capable of checking at compile-time that all Smart COntract executions fulfill a set of security rules.
Certora Prover technology is available as a tool that complements existing compilers and debuggers of Smart Contracts. It checks that the contracts adhere to the interface requirements of other contracts. Certora’s blockchain-independent and language-agnostic Prover technology precisely identifies bugs in Smart Contracts and proves their absence.

Content

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
  - [Create a conf file](#create-a-conf-file)
  - [Start a verification](#start-a-verification)
  - [Results](#results)
- [Commands](#commands)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- Go To Definition
- Calltrace & Variables watch
- Simultaneous scripts checking
- Easy to read status of contract checking

## Prerequisites

To start, you need to install and set the script. It helps to start checking the contract. [Please follow the installation instructions](https://certora.atlassian.net/wiki/spaces/CPD/pages/7274497/Installation+of+Certora+Prover).

## Usage

### Create a conf file

When starting the verification, you will be prompted to set the configurations, such as the main contract name, solidity compiler version, and more. These configurations will be stored in a local configuration file in the `conf` subfolder. You can edit the configuration file manually or create a new one (by clicking on the {create_conf_file_button name} button).

You can add additional flags to specify the testing area for smart contrast. The list of available options you can find under the documents link: [Certora Prover CLI Options](https://certora.atlassian.net/wiki/spaces/CPD/pages/7340043/Certora+Prover+CLI+Options)

### Start a verification

Prover script will use the conf file info and option and will start the verification process. The user uses VS Code Command Palette (Ctrl/Cmd + Shift + P) to run the Certora Run script (the same way it works now, but the user will be using VS Command Palette instead of CLI).

Users can run multiple jobs for checking. Users will have a special section where the system will show all ongoing processes and stop the process. After stopping the job, the process will be hidden from the list.

### Results

After the script finishes, the checking process under the activity bar system will show a tree with jobs. The user can see a list of jobs (functions), call traces, connected variables, and assertion messages.

## Commands

This extension contributes the following commands and can be accessed via [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette):

| command                | description                                      | availability   |
| ---------------------- | ------------------------------------------------ | -------------- |
| Certora: Run Script    | Choose a conf-file to run a job & start checking | On Results Tab |
| Certora: Show Settings | Shows settings window                            | Always         |
| Certora: Clear Results | Clears results list                              | On Results Tab |

## Troubleshooting

If you have any questions about the tool and way how you can setup it for your needed you can use our FAQ: https://www.certora.com/#FAQ

(We need text here about logs directory and support email address)

## License

(Do weed need it?)
