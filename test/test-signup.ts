// deno run --allow-net --allow-env --env test/test-signup.ts "email" "password"
// use email:test@email.com and password:password
import { supabase } from "../supabase/client.ts";

const email = Deno.args[0]
const password = Deno.args[1]

console.log(email, password)
if (!!email && !!password){
    console.log("Signing Up")
    await supabase.auth.signUp({email, password})
}