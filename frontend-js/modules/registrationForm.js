import axios from 'axios'

export default class registrationFormValidation {
    constructor(){
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.form = document.querySelector("#registration-form")
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.usernameField = document.querySelector("#username-register")
        this.emailField = document.querySelector("#email-register")
        this.passwordField = document.querySelector("#password-register")
        this.passwordField2 = document.querySelector(".password2")
        //this method is assigning new property on property Ex this.property.property
        this.usernameField.previousValue = ""
        this.emailField.previousValue = ""
        this.passwordField.previousValue = ""
        this.usernameField.isunique = false
        this.emailField.isunique = false
        this.event()
        
    }

    //event
    event() {
        this.form.addEventListener('submit', e => {
            e.preventDefault()
            this.formSumbitHandler()
        })

        this.usernameField.addEventListener('keyup', () => {
            this.isDifferent(this.usernameField, this.usernameHandler)
        })

        this.emailField.addEventListener('keyup', () => {
            this.isDifferent(this.emailField, this.emailHandler)
        })

        this.passwordField.addEventListener('keyup', () => {
            this.isDifferent(this.passwordField, this.passwordHandler)
        })

        this.passwordField2.addEventListener('keyup', () => {
            this.isDifferent(this.passwordField2, this.passwordHandler)
        })

        this.usernameField.addEventListener('blur', () => {
            this.isDifferent(this.usernameField, this.usernameHandler)
        })

        this.emailField.addEventListener('blur', () => {
            this.isDifferent(this.emailField, this.emailHandler)
        })

        this.passwordField.addEventListener('blur', () => {
            this.isDifferent(this.passwordField, this.passwordHandler)
        })
    }
    //method
    formSumbitHandler() {
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmediately()
        this.passwordAfterDelay()

        if(
            this.usernameField.isunique &&
            !this.usernameField.errors &&
            this.emailField.isunique &&
            !this.emailField.errors &&
            !this.passwordField.errors
            ) {
                this.form.submit()
        }
    }

    isDifferent(element, handler) {
        if(element.previousValue != element.value){
            handler.call(this)
        }
        element.previousValue = element.value
    }

    usernameHandler() {
        this.usernameField.errors = false
        this.usernameImmediately()
        clearTimeout(this.usernameField.timer)
        this.usernameField.timer = setTimeout(() => this.usernameAfterDelay(), 800)
    }

    emailHandler() {
        this.emailField.errors = false
        clearTimeout(this.emailField.timer)
        this.emailField.timer = setTimeout(() => this.emailAfterDelay(), 800)
    }

    passwordHandler() {
        this.passwordField.errors = false
        this.passwordImmediately()
        clearTimeout(this.passwordField.timer)
        this.passwordField.timer = setTimeout(() => this.passwordAfterDelay(), 800)
    }

    usernameImmediately() {
        if(this.usernameField.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.usernameField.value)) {
            this.showValidatorError(this.usernameField, "Username can only contain letters and number")
        }

        if(this.usernameField.value.length > 30){
            this.showValidatorError(this.usernameField, "Username must only contain 30 characters")
        }

        if(!this.usernameField.errors) {
            this.hideValidationError(this.usernameField)
        }
    }

    passwordImmediately() {

        if(this.passwordField.value && this.passwordField2.value){
            if(this.passwordField.value != this.passwordField2.value) {
                this.showValidatorError(this.passwordField, "Password dont match")
            }
        }
        
        if(this.passwordField.value.length > 25){
            this.showValidatorError(this.passwordField, "Password cannot exceed 50 characters")
        }

        if(!this.passwordField.errors){
            this.hideValidationError(this.passwordField)
            this.hideValidationError(this.passwordField2)
        }
    }

    passwordAfterDelay() {
        if(this.passwordField.value.length <= 5){
            this.showValidatorError(this.passwordField, "Password must be at least 12 characters")
        }

        if(this.passwordField.value.length >= 6){
            this.showValidatorError(this.passwordField2, "Please confirm your password here")
        }

        if(this.passwordField.value === this.passwordField2.value){
            this.hideValidationError(this.passwordField)
            this.hideValidationError(this.passwordField2)
        }
    }

    emailAfterDelay() {
        if(!/^\S+@\S+$/.test(this.emailField.value)){
            this.showValidatorError(this.emailField, "Please enter a valid email")
        } 

        if(!this.emailField.errors){
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.emailField.value}).then((response) => {
                if(response.data) {
                    this.showValidatorError(this.emailField, "Email is already taken")
                    this.emailField.isunique = false
                } else {
                    this.emailField.isunique = true
                    this.hideValidationError(this.emailField)
                }
            }).catch(() => console.log("please try again"))
        }
    }

    hideValidationError(element) {
        element.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    showValidatorError(element, message) {
        element.nextElementSibling.innerHTML = message
        element.nextElementSibling.classList.add("liveValidateMessage--visible")
        element.errors = true
    }

    usernameAfterDelay() {
        if(this.usernameField.value.length < 3){
            this.showValidatorError(this.usernameField, "Username must contain atleast 3 characters")
        }

        if(!this.usernameField.errors) {
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.usernameField.value}).then((response) => {
                if(response.data) {
                    this.showValidatorError(this.usernameField, "This username is taken")
                    this.usernameField.isunique = false
                } else {
                    this.usernameField.isunique = true
                }
            }).catch(() => console.log("Please try again"))
        }
    }

    insertValidationElements() {
        this.allFields.forEach(el => {
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }

}
