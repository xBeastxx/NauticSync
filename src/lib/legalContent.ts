
export const CREDITS = {
    developer: "Manuel P. Rodriguez",
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

This End User License Agreement ("Agreement") is between you and NauticGames™ and governs use of this app made available through the Apple App Store or Google Play Store, or downloaded directly.

1. SCOPE OF LICENSE
NauticGames™ hereby grants you a limited, non-exclusive, non-transferable, revocable license to use the Application for your personal, non-commercial purposes strictly in accordance with the terms of this Agreement.

2. RESTRICTIONS
You agree not to, and you will not permit others to:
* License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose, or otherwise commercially exploit the Application.
* Modify, make derivative works of, disassemble, decrypt, reverse compile or reverse engineer any part of the Application.

3. INTELLECTUAL PROPERTY
All intellectual property rights, including copyrights, patents, patent disclosures and inventions (whether patentable or not), trademarks service marks, trade secrets, know-how and other confidential information, trade dress, trade names, logos, corporate names and domain names, together with all of the goodwill associated there with, derivative works and all other rights (collectively, "Intellectual Property Rights") that are part of the Software that are otherwise owned by NauticGames™ shall always remain the exclusive property of NauticGames™.

4. NO WARRANTY
YOU EXPRESSLY UNDERSTAND AND AGREE THAT THE APPLICATION IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. NAUTICGAMES™ EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.

5. LIMITATION OF LIABILITY
IN NO EVENT SHALL NAUTICGAMES™ BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the jurisdiction in which NauticGames™ operates, without regard to its conflict of law provisions.

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
