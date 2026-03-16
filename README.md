Local development of the edge function before pushing it on the cloud <3 

Instruction on how to use for my bestie:
1. Install deno using: npm install -g deno
2. Install extension denoland from vscode extension
3. Install the vscode extension REST Client
4. Run `deno run dev` on command line 

5. Send post request using requests/testing.rest ![alt text](thisButton.png) or go to browser and type http://localhost:8000/?word={word}
> Replace {word} with the word you want, for example http://localhost:8000/?word=bank
> Add the flag save=true if you want to save it into word-example. http://localhost:8000/?word=bank&save=true
