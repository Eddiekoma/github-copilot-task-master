+-------------------+
|   VS Code Client  |
|                   |
| +---------------+ |
| |   Wizard UI   | | <--- User Interaction
| +---------------+ |
|                   |
| +---------------+ | <--- Task Management
| | Task Tracker  | |
| +---------------+ |
+-------------------+
         |
         v
+-------------------+
|   Node.js Server  |
|                   |
| +---------------+ |
| |   API Layer   | | <--- Handles requests from the client
| +---------------+ |
|                   |
| +---------------+ |
| |   AI Service   | | <--- Interacts with AI APIs
| +---------------+ |
|                   |
| +---------------+ |
| |   Database     | | <--- Stores user settings and project data
| +---------------+ |
+-------------------+