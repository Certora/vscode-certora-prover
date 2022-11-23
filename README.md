# Certora IDE

The new version of the Certora IDE extension is out!

The Certora Prover checks at compile-time that all smart contract executions fulfill a set of security rules and interface requirements of other contracts. Certora’s blockchain-independent and language-agnostic Prover technology precisely identifies bugs in Smart Contracts and proves their absence.


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

## Prerequisites

Please follow the Certora Prover [installation instructions](https://certora.atlassian.net/wiki/spaces/CPD/pages/7274497/Installation+of+Certora+Prover).  Please note that steps 1, 2, and 4 are required, while step number 3 is optional but highly recommended.

## Usage

### Create a new job

When you first open the IDE, you will see this starting screen:

![image](https://user-images.githubusercontent.com/101042618/203574085-3fc6dd36-6298-4c28-9591-59277ab93a3f.png)

To create your first job, click either the “Create verification run” button. Then, you will get a new input window where you can name your job.

![image](https://user-images.githubusercontent.com/101042618/203574167-116485cc-ffcc-48e5-b1cc-0e2bc2a2840b.png)

Job name is limited to 35 characters.

![image](https://user-images.githubusercontent.com/101042618/203574292-fdec5bf2-b2f0-4741-9e08-5b4952c8a915.png)

After pressing Enter you will see your job list item and the job’s settings form tub will open (see next step for a deeper dive into job list items and the settings form).

![image](https://user-images.githubusercontent.com/101042618/203574324-03d52268-3c4b-40b1-915c-6af23e9189d1.png)



### Start a verification

The job list and setting form looks like this following image:

![image](https://user-images.githubusercontent.com/101042618/203574517-ea48ecce-56b0-4ea7-94a6-77485fa5fdbe.png)

* Notice that the order of filling the settings form is solidity files and contracts related settings first, and spec related settings second.

* Red star next to a field name means it is a mandatory field, and it must be filled to be able to run the job.

* The description inside each setting input box is there to assist you - please read it carefully, in many cases the input required will be different than the flag value you are used to.

* Some values are filled automatically according to popular conventions, but it is best to make sure the value is true to your current requirements.

The Certora spec settings looks like the following image:

![image](https://user-images.githubusercontent.com/101042618/203575021-ba39433b-58e2-4ae5-85e7-a50b16ff70d4.png)

* If staging is not checked - run on production

* The Certora Spec settings form will not be available until the mandatory fields in the Solidity Contracts part are filled

A message that describes the job:

![image](https://user-images.githubusercontent.com/101042618/203575303-a7bae547-dcc4-4fff-8378-a382d9e58262.png)

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
