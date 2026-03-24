// deno run --allow-net --allow-env --env test/test-signup.ts "email" "password"
// for signing up 
import { supabase } from "../supabase/client.ts";

const email = Deno.args[0]
const password = Deno.args[1]

console.log(email, password)
if (!!email && !!password){
    console.log("Signing Up")
    const {data, error} = await supabase.auth.signUp({email, password})
    console.log("DATA:", data)
    console.error("ERROR:", error)
}