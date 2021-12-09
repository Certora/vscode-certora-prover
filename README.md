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

When starting the verification, you will be prompted to set the configurations, such as the main contract name, solidity compiler version, and more. These configurations will be stored in a local configuration file in the `conf` subfolder. You can edit the configuration file manually or create a new one (by clicking on the {`create_conf_file_button name`} button).

You can add additional flags to specify the testing area. You can find the list of available options in the document [Certora Prover CLI Options](https://certora.atlassian.net/wiki/spaces/CPD/pages/7340043/Certora+Prover+CLI+Options)

### Start a verification

The Prover script will use the `conf` file information to start the verification process. Use the VS Code Command Palette (`Ctrl/Cmd + Shift + P`) to run the Certora Run script. You can verify multiple contracts. A special section shows all ongoing processes. You can stop a process to remove it from the list.

#### Stop process
After the user stops the script, the script job will continue to check in the cloud. The script, in that case, works as a trigger for the job in the cloud.

### Results

After the script finishes, the checking process under the activity bar system will show a tree of verification jobs. You will see a list of all the jobs, along with their call traces, connected variables, and assertion messages.

## Commands

The following commands can be accessed via [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette):

| command                | description                                       | availability   |
| ---------------------- | ------------------------------------------------- | -------------- |
| Certora: Run Script    | Choose a conf-file to run a job & start verifying | On Results Tab |
| Certora: Show Settings | Shows the `settings` window                       | Always         |
| Certora: Clear Results | Clears the results list                           | On Results Tab |

## Troubleshooting

### Freeze
If the user experiences a frozen state (buttons don't work), the user needs to use hotkey `cmd/ctrl + shift + p` and find the command `Developer: Open Webview Developer Tools`. In the devtool window, press `Console` and copy (or make a screenshot) of the logs. Next, press `cmd/ctrl + shift + p` and find `Developer: Reload Window command`, which restarts the window.

If you have any questions about the tool and how to set it up for your needs, see our FAQ: https://www.certora.com/#FAQ

(We need a text here about logs directory and support email address)

## License

(Do weed need it?)
