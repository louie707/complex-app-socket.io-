import axios from 'axios'
import DomPurify from 'dompurify'

export default class Search {
    //Select DOM
    constructor() {
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.viewSearchWindow()
        this.headerSearchIcon = document.querySelector(".header-search-icon")
        this.closeSearchIcon = document.querySelector(".close-live-search")
        this.overlay = document.querySelector(".search-overlay")
        this.inputField = document.querySelector("#live-search-field")
        this.resultsArea = document.querySelector(".live-search-results")
        this.loaderIcon = document.querySelector(".circle-loader")
        this.typingWaitTimer
        this.previousValue = ""
        this.events()
    }

    // Event
    events() {
        this.inputField.addEventListener("keyup", () => this.keypressHandler())

        this.headerSearchIcon.addEventListener("click", e => {
            e.preventDefault()
            this.showOverlay()
        })

        this.closeSearchIcon.addEventListener("click", e => {
            e.preventDefault()
            this.hideOverlay()
        })
    }

    // Method
    showOverlay() {
        this.overlay.classList.add("search-overlay--visible")
        setTimeout(() => this.inputField.focus(), 100)
    
    }

    keypressHandler() {
        let value = this.inputField.value

        if(value == ""){
          clearTimeout(this.typingWaitTimer)
          this.hideLoaderIcon()
          this.hideResultsArea()
        }

        if(value != "" && value != this.previousValue){
            clearTimeout(this.typingWaitTimer)
            this.showLoaderIcon()
            this.hideResultsArea()
            this.typingWaitTimer = setTimeout(() => this.sendRequest(), 3000)
        }

        this.previousValue = value
    }

    sendRequest() {
        axios.post("/search", {_csrf: this._csrf, searchTerm: this.inputField.value}).then((response) => {
          console.log(response.data)
          this.renderResultsHTML(response.data)
        }).catch(() => {
            alert("hello, the request failed")
        })
    }

    renderResultsHTML(posts){
      posts.forEach((post) => {
        console.log(post)
      })
      if(posts.length){
        this.resultsArea.innerHTML = DomPurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${posts.length} items found)</div>
        ${
          posts.map(post => {
            let postDate = new Date(post.dateCreated)
            return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
            <img class="avatar-tiny" src="${post.author.avatar}" <strong>${post.title}</strong>
            <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() +1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
          </a>`
          }).join("")
        }
      </div>`)
      } else {
        this.resultsArea.innerHTML = `<p>something went wrong</p>`
      }
      this.hideLoaderIcon()
      this.showResultsArea()
    }

    showLoaderIcon() {
        this.loaderIcon.classList.add("circle-loader--visible")
    }

    hideLoaderIcon() {
      this.loaderIcon.classList.remove("circle-loader--visible")
    }

    showResultsArea() {
      this.resultsArea.classList.add("live-search-results--visible")
    }

    hideResultsArea() {
      this.resultsArea.classList.remove("live-search-results--visible")
    }

    hideOverlay() {
        this.overlay.classList.remove("search-overlay--visible")
    }

    viewSearchWindow() {
        document.body.insertAdjacentHTML("beforeend", `
        <div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results">
          
        </div>
      </div>
    </div>
  </div>
        `)
    }
}