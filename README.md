# Certora IDE

The new version of the Certora IDE extension is out!

The Certora Prover checks at compile-time that all smart contract executions fulfill a set of security rules and interface requirements of other contracts. Certora’s blockchain-independent and language-agnostic Prover technology precisely identifies bugs in Smart Contracts or prove their absence.


Content

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
  - [Create a new job](#create-a-new-job)
  - [Start a verification](#start-a-verification)
  - [Results](#results)
  - [Statuses](#statuses)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- Go to Definition
- Call Trace & Variables View
- Check multiple contracts in parallel
- Checking progress status
- Support Multiple Jobs in parallel
- New and Extended Settings Form

## Prerequisites

Please follow the Certora Prover [installation instructions](https://docs.certora.com/en/latest/).  Please note that steps 1, 2, and 4 are required, while step number 3 is optional but highly recommended.

## Usage

### Create a new job

When you first open the IDE, you will see this starting screen:

![image](https://user-images.githubusercontent.com/96879706/210215779-f7fd12a2-0475-4679-93ef-34cb6654bffc.png)

To create your first job, click either the “Create verification run” button. Then, you will get a new input window where you can name your job.

![image](https://user-images.githubusercontent.com/101042618/203574167-116485cc-ffcc-48e5-b1cc-0e2bc2a2840b.png)

Job name is limited to 35 characters.

After pressing Enter you will see your job list item and the job’s settings form tab will open (see next step for a deeper dive into job list items and the settings form).

|Description|Location|
|---|---|
|<ol><li>Certora Plugin Settings</li><li>Job list header actions<br>   - Run All<br>- Create New Job From Conf File<br>- Create New Job</li><li>Start/rerun</li><li>Job list item action<br>- Rule Report<br>- Rename<br>- Settings<br>- Delete<br>- Duplicate</li></ol>|![image](https://user-images.githubusercontent.com/96879706/210216531-61a98a76-7273-4a84-91f6-d4e86319f0b7.png) |

### Start a verification

The job list and setting form looks like this following image:

|Description|Location|
|---|---|
|<ol><li>Solidity Contracts Settings</li><li>Main Contract Path</li><li>Main Contract Name</li><li>Compiler Executable Name</li><li>Linked Contracts</li><li>Use multiple contracts</li></ol>|<img src="https://user-images.githubusercontent.com/96879706/210220606-71302c46-2c31-47b8-8a62-2906d28f0160.png" width="800"> |

* Notice that the order of filling the settings form is solidity files and contracts related settings first, and spec related settings second.

* Red star next to a field name means it is a mandatory field, and it must be filled to be able to run the job.

* The description inside each setting input box is there to assist you - please read it carefully, in many cases the input required will be different than the flag value you are used to.

* Some values are filled automatically according to popular conventions, but it is best to make sure the value is true to your current requirements.

The Certora spec settings looks like the following image:

|Description|Location|
|---|---|
|<ol><li>Spec settings</li><li>Spec file Name</li><li>Verify only Specified Rules<br>(separated by comma)</li></ol>|<img src="https://user-images.githubusercontent.com/96879706/210221289-d00f67d4-3605-4519-b089-177284579ab4.png" width="800">|

* If staging is not checked - run on production

* The Certora Spec settings form will not be available until the mandatory fields in the Solidity Contracts part are filled

A message that describes the job:

|Description|Location|
|---|---|
|<ol><li>Verification Message settings</li><li>Message will be shown on rule report</li></ol>|<img src="https://user-images.githubusercontent.com/96879706/210221556-42f94dc7-50c7-4305-9d63-00b6d70afaa1.png" width="800">|

* The default value is the job name. 

* It is best to keep it short and informative.


### Results

While the verification process advances, you'll see each property (rule or invariant) in the sidebar view. Assert message/s will also be shown when the property reaches a final state(verified/violated/error). Clicking on each of these assertions will reveal all the available information, such as a call trace, variables, and more.

![go-to-code](assets/go-to-code.gif)

Go to verification report from the job list item:

![image](https://user-images.githubusercontent.com/101042618/203575476-264a610a-87cd-4adf-94e5-45c54531b7bb.png)


## Statuses

The following image shows the possible job statuses and their meaning:

![image](https://user-images.githubusercontent.com/101042618/203576203-c9de1cba-47fb-45ab-b7bb-2d07a595a01d.png)

* Job can’t run while in Finish Setup status. 

* Job can’t be edited, renamed or duplicated while in Running / Pending status.

* See the job’s verification report by pressing the icon in the job list item while in Success status (see the following image).


## Troubleshooting

### Freeze

If you experience a frozen state (buttons don't work), you need to use `cmd/ctrl + shift + p` and find the `Developer: Open Webview Developer Tools` command. Go to the `console` in the devtool window, and copy (or make a screenshot of) the logs. Next, press `cmd/ctrl + shift + p` and type `Developer: Reload Window`.

### CERTORAKEY is missing

The following error message - `Couldn't find Certora Key` may indicate that the `CERTORAKEY` variable was not defined globally. You can try to fix it at the VS Code level. For doing this, please go to the VS Code Settings, in the `Search Settings` input type `integrated env`, and click the `edit in settings.json` based on your OS. Put the `CERTORAKEY` in the opened settings.json file in the following way (replace the `linux` with your OS):
```
"terminal.integrated.env.linux": {
    "CERTORAKEY": "place_your_certora_key_here"
}
```

### Logs & Notifications

Every time you start a verification, the extension creates a new log file and stores it in the `certora-logs` subfolder. Notifications will be presented on the verification completion or in case of an error (in such a case, you will get a link to the related log file).

If you have any questions about the tool and how to set it up for your needs, see our FAQ: https://www.certora.com/#FAQ.
You can also contact us by email: [support@certora.com](support@certora.com).


## License

vscode-certora-prover is [MIT licensed](LICENSE).
