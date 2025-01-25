### TPClient 

TPClient is the frontend application for MatPerspektiv.se

#### Features
- Custom Chart with some interactivity. No library was used.  
- Unique search UI, designed to feel like a natural way  
  to interact with the two decoupled search endpoints.  
  
#### Central Project Files  

- **TypeScript and React:** [App.tsx](/tpclient/src/App.tsx)  

- **CSS:**  [App.css](/tpclient/src/App.css)  
  
---
TPClient was a great learning experience for me, since my practical work  
with TypeScript and React was very limited prior to this project.  
Here are some things I would do differently if I were to recreate it:  
  
1. Utilize a library for global state management.  
(The standard way of passing around state does negatively impact readability.)  
  
2. Prioritize time for refactoring, and split up components into separate files.  
  
3. Be mindful of behind-the-scenes rendering from the very start.  
This frontend is so light to execute that it does not matter practically speaking,   
but optimization would be needed if the site was to have magnitudes more content.  
