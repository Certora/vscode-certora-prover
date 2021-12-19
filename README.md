# Certora IDE

The Certora Prover checks at compile-time that all smart contract executions fulfill a set of security rules and interface requirements of other contracts. Certora’s blockchain-independent and language-agnostic Prover technology precisely identifies bugs in Smart Contracts and proves their absence.
![overview](assets/overview_comments.png)

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
- View Calltraces & Variables
- Simultaneous contracts checking
- Easy to read status of contract checking

## Prerequisites

To check the contract, you first need to install and set the script. [Please follow the installation instructions](https://certora.atlassian.net/wiki/spaces/CPD/pages/7274497/Installation+of+Certora+Prover).

## Usage

### Create a conf file

When starting a verification, you will be prompted to set the configurations, such as the main contract name, solidity compiler version, and more. These configurations will be stored in a local configuration file in the `conf` subfolder. You can edit the configuration file manually or create a new one (by clicking on the {`create_conf_file_button name`} button).

You can add additional flags to specify the testing area. You can find the list of available configuration options in the document [Certora Prover CLI Options](https://certora.atlassian.net/wiki/spaces/CPD/pages/7340043/Certora+Prover+CLI+Options)

![create_conf_file](assets/conf_file.png)

### Start a verification

The Prover script will use the `conf` file information to start the verification process. Use the VS Code Command Palette (`Ctrl/Cmd + Shift + P`) to run the Certora Run script. You can verify multiple contracts. A special section shows all ongoing processes. You can stop a process to remove it from the list.
![start](assets/run-the-script.gif)

#### Stop process
After you stop the script, the script job will continue to check in the cloud. The script, in that case, works as a trigger for the job in the cloud.

### Results

After the script finishes, the checking process under the activity bar system will show a tree of verification jobs. You will see a list of all the jobs, along with their call traces, connected variables, and assertion messages.
![go-to-code](assets/go-to-code.gif)

## Commands

The following commands can be accessed via the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette):

| command                | description                                       | availability   |
| ---------------------- | ------------------------------------------------- | -------------- |
| Certora: Run Script    | Choose a conf file to run a job & start verifying | On Results Tab |
| Certora: Show Settings | Shows the `settings` window                       | Always         |
| Certora: Clear Results | Clears the results list                           | On Results Tab |

## Troubleshooting

### Freeze

If the extension freezes and buttons do not work, press the hotkey `cmd/ctrl + shift + p` and find the `Developer: Open Webview Developer Tools` command. In the `devtool` window, press `Console` and copy (or make a screenshot of) the logs. Next, press `cmd/ctrl + shift + p` and find `Developer: Reload Window command`, which restarts the window.

### CERTORAKEY missing

If the CERTORAKEY is not installed globally, you can install it at the VS Code level. To do this, in the VS Code setting `terminal.integrated.env.`, you need to set it as an environment variable:
```
"env": {
        "CERTORAKEY": "place_your_certora_key_here",
      }
```

If you have any questions about the tool and how to set it up for your needs, see our FAQ: https://www.certora.com/#FAQ

(Insert text here about logs directory and support email address)


## License

(MIT)
