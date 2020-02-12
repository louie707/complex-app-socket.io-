import Search from "./modules/search"
import Chat from "./modules/chat"
import registrationFormValidation from "./modules/registrationForm"

if(document.querySelector("#registration-form")){new registrationFormValidation()}
if(document.querySelector("#chat-wrapper")){new Chat()}
if(document.querySelector(".header-search-icon")){new Search()}