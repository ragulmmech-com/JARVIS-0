sed -i '1s/^/import localforage from "localforage";\n/' src/App.tsx
sed -i 's/localStorage.setItem("jarvis_all_chat_sessions_v1"/localforage.setItem("jarvis_all_chat_sessions_v1"/g' src/App.tsx
sed -i 's/localStorage.setItem("jarvis_remodel_memory_v3"/localforage.setItem("jarvis_remodel_memory_v3"/g' src/App.tsx
