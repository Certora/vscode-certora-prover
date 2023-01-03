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
  - [Status](#status)
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

Please follow the Certora Prover [installation instructions](https://docs.certora.com/en/latest/docs/user-guide/getting-started/index.html).  Please note that steps 1, 2, and 4 are required, while step number 3 is optional but highly recommended.

## Usage

### Create a New Job

When you first open the IDE you will see this starting screen:

![image](https://user-images.githubusercontent.com/96879706/210215779-f7fd12a2-0475-4679-93ef-34cb6654bffc.png)

To create your first job click either the

“Configure New Job” button - this option will open an empty new Job. use the Settings Menu to configure Job details.

Or the “Upload Configuration File” button - this option will automaticly create a new job from the chosen .conf file.


After creating a job, you will see your job list item and the job’s settings form tab will open.

|Description|Location|
|---|---|
|<ol><li>Certora Plugin Settings</li><li>Job List Header Actions<br>   - Run All<br>- Create New Job From Conf File<br>- Create New Job</li><li>Start/Rerun</li><li>Job List Item Actions<br>- Rule Report<br>- Rename<br>- Settings<br>- Delete<br>- Duplicate</li></ol>|![image](https://user-images.githubusercontent.com/96879706/210216531-61a98a76-7273-4a84-91f6-d4e86319f0b7.png) |

### Start a Verification

#### Solidity Settings:

|Description|Location|
|---|---|
|<ol><li>Solidity Contracts Settings</li><li>Main Contract Path</li><li>Main Contract Name</li><li>Compiler Executable Name</li><li>Linked Contracts</li><li>Use Multiple Contracts</li></ol>|<img src="https://user-images.githubusercontent.com/101042618/210350567-4b2af592-cb4f-4c33-bea9-5ff812d0997d.png" width="800"> |

* Red star next to a field name means it is a mandatory field, and it must be filled to be able to run the job.

* The description inside each setting input box is there to assist you - please read it carefully, in many cases the input required will be different than the flag value you are used to.

* Some values are filled automatically according to popular conventions, but it is best to make sure the value is true to your current requirements.

#### Certora Spec Settings:

|Description|Location|
|---|---|
|<ol><li>Spec Settings</li><li>Spec File Name</li><li>Verify Only Specified Rules<br>(separated by comma)</li></ol>|<img src="![image](https://user-images.githubusercontent.com/101042618/210351128-3543bbb8-fb0b-40a9-a8cd-f1681dadd95b.png)" width="800">|

#### Message Describing The Job:

|Description|Location|
|---|---|
|<ol><li>Verification Message Settings</li><li>Message Shown on Rule Report</li></ol>|<img src="![image](https://user-images.githubusercontent.com/101042618/210351190-59dbf3a0-4e8c-45d4-9a31-7b54230743b0.png)" width="800">|

* Default value is job's name. 

* It is best to keep it short and informative.


### Results

While the verification process advances, you'll see each property (rule or invariant) in the sidebar view. Assert message/s will also be shown when the property reaches a final state(verified/violated/error). Clicking on each of these assertions will reveal all the available information, such as a call trace, variables, and more.

![go-to-code](assets/go-to-code.gif)

Go to Rule Report from the job list item:

![Screen Shot 2023-01-02 at 16 12 22](https://user-images.githubusercontent.com/101042618/210242771-5da08a0b-d537-4743-b7b0-d148f82678f1.png)



## Status

The following image shows possible job status:

![Screen Shot 2023-01-02 at 16 11 18](https://user-images.githubusercontent.com/101042618/210242674-e9cb0906-a45a-47fa-99a9-acfe047530d5.png)

* Job cannot run while in "Missing Settings" status. 

* Job cannot be edited, renamed or duplicated while in "Running" / "Pending" status.


## Troubleshooting

### Freeze

If you experience a frozen state (buttons don't work), you need to use `cmd/ctrl + shift + p` and find the `Developer: Open Webview Developer Tools` command. Go to the `console` in the devtool window, and copy (or make a screenshot of) the logs. Next, press `cmd/ctrl + shift + p` and type `Developer: Reload Window`.

### CERTORAKEY is Missing

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
