
export const CREDITS = {
    developer: "Manuel P. Rodriguez",
    collaborator: "Ivan Manso",
    company: "NauticGames™",
    email: "nauticgamesstudios@gmail.com",
    role: "Lead Developer & Architect",
    year: new Date().getFullYear(),
    libraries: [
        "Syncthing (Core Protocol)",
        "Electron",
        "React & Vite",
        "TailwindCSS",
        "Lucide Icons",
        "TanStack Query"
    ]
};

export const TERMS_AND_CONDITIONS = `
# TERMS AND CONDITIONS

Last Updated: ${new Date().toLocaleDateString()}

1. INTRODUCTION
Welcome to NauticSync by NauticGames™. By accessing or using our application, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.

2. USAGE LICENSE
NauticGames™ grants you a personal, non-transferable, non-exclusive license to use the NauticSync software on your devices in accordance with these Terms.

3. USER RESPONSIBILITIES
You are responsible for:
* Maintaining the confidentiality of your device keys and configuration.
* The content of the files you synchronize.
* Ensuring you have the rights to transfer and store such files.

4. DISCLAIMER
The software is provided "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability.

5. INTELLECTUAL PROPERTY
The Service and its original content (excluding User Content), features and functionality are and will remain the exclusive property of NauticGames™ and its licensors.

6. TERMINATION
We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
`;

export const EULA = `
# END USER LICENSE AGREEMENT (EULA)

This End User License Agreement ("Agreement") is a legal agreement between you and NauticGames™ handling the use of the NauticSync software. By installing or using the App, you agree to be bound by this Agreement. If you do not agree, do not install or use the App.

1. LICENSE GRANT
NauticGames™ grants you a revocable, non-exclusive, non-transferable, limited license to use the Software solely for your personal, non-commercial purposes strictly in accordance with the terms of this Agreement.

2. STRICT RESTRICTIONS (THE "IRONCLAD" CLAUSE)
You agree NOT to, and you will not permit others to:
* Decompile, reverse engineer, disassemble, attempt to derive the source code of, or decrypt the Application.
* Modify, adapt, improve, enhance, translate, or create derivative works from the Application.
* Violate any applicable laws, rules, or regulations in connection with your access or use of the Application.
* Remove, alter, or obscure any proprietary notice (including any notice of copyright or trademark) of NauticGames™ or its affiliates.
* Use the Application for any revenue-generating endeavor, commercial enterprise, or other purpose for which it is not designed or intended.
* Distribute, rent, lease, lend, sell, transfer, or sub-license the Application to any third party.

3. INTELLECTUAL PROPERTY RIGHTS
The Application, including without limitation all copyrights, patents, trademarks, trade secrets, and other intellectual property rights are, and shall remain, the sole and exclusive property of NauticGames™. You shall not acquire any ownership interest in the Application under this Agreement.

4. TERMINATION
This Agreement is effective until terminated by you or NauticGames™. Your rights under this Agreement will terminate automatically without notice if you fail to comply with any of its terms. Upon termination, you must cease all use of the Application and delete all copies of the Application from your devices.

5. NO WARRANTY
THE APPLICATION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITH ALL FAULTS AND DEFECTS WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, NAUTICGAMES™ EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.

6. SEVERABILITY
If any provision of this Agreement is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the strict laws of the jurisdiction of NauticGames™, excluding its conflicts of law rules.

Copyright © ${new Date().getFullYear()} NauticGames™. All rights reserved.
`;

export const PRIVACY_POLICY = `
# PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. DATA COLLECTION
NauticSync is designed as a peer-to-peer (P2P) synchronization tool.
* We do NOT collect, store, or transmit your personal files to our servers.
* Files are transferred directly between your own devices using the Syncthing protocol.

2. LOCAL DATA
* Configuration and device identity keys are stored locally on your machine.
* Application settings are stored locally.

3. ANALYTICS
* The application does not contain third-party analytics or tracking pixels.
* Crash reports may be generated locally but are not automatically sent to us without your consent.

4. NETWORK COMMUNICATION
* The application communicates primarily on your local network (LAN).
* If configured for remote access, it may use public discovery servers to find your other devices, but no file data passes through these discovery servers.
* If a direct connection cannot be established, encrypted relay servers may be used, but they cannot see your data (end-to-end encryption).

5. CHANGES
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

6. CONTACT US
If you have any questions about this Privacy Policy, please contact us at:
nauticgamesstudios@gmail.com
`;
