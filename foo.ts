if (import.meta.main) {
  const token = crypto.randomUUID(); // Replace this with an actual token using supabase signin later
  await Deno.writeTextFile(".env", `TOKEN=${token}\n`); // Write the token into .env to perform experimentation on testing.rest
}

Deno.serve(async (req) => {
  switch (req.method) {
    // POST METHOD (Use this)
    case "POST": {
      const reqJson = await req.json();
      console.log("Received Payload:", req);

      const { word } = reqJson;
      console.log(`Working on the word ${word}`);

      const data = {
        message: `Fetching the word ${word}!`,
      };

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // (This is just for analysing the data; go to http://localhost:8000/?word={word}&?save={boolean} to use the api on browser)
    // e.g. http://localhost:8000/?word=bank or http://localhost:8000/?word=bank&save=true to save in word-example
    case "GET": {
      console.log("GET TRIGGERED");

      const url = new URL(req.url);
      const word = url.searchParams.get("word"); // Word to fetch
      const save = url.searchParams.get("save"); // Save into word-example folder

      const urlToFetch = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`; // Dictionary api endpoint
      const fetchedData = await fetch(urlToFetch); // Fetch the data of {word} from the api
      const data = await fetchedData.json(); // Parse into json

      // Save the word if save = true
      if (save) {
        Deno.writeTextFile(
          `word-example/${word}.json`,
          JSON.stringify(data, null, 2),
        );
      }

      // Display on browser
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
});
