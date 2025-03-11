Thought for 4 seconds```markdown project="Cloner News" file="README.md"
...

````

clonernews/
├── index.html      # Main HTML structure
├── styles.css      # CSS styling
└── script.js       # JavaScript functionality

```plaintext

## Code Explanation

### HTML (index.html)

```html
&lt;!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />                                  &lt;!-- Character encoding -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" /> &lt;!-- Responsive viewport -->
    <link rel="stylesheet" type="text/css" href="styles.css" /> &lt;!-- Link to CSS file -->
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />                                                        &lt;!-- Google Fonts import -->
    <title>Clonernews</title>                                 &lt;!-- Page title -->
  </head>
  <body>
    <div id="header">                                         &lt;!-- Header section -->
      <h2><a id="logo">Cloner News</a></h2>                   &lt;!-- Logo/title -->
      <div id="categoriesSelector">                           &lt;!-- Navigation buttons -->
        <button id="newsButton">news</button>
        <button id="jobsButton">jobs</button>
        <button id="pollsButton">polls</button>
      </div>
    </div>

    <div class="popUp" id="popUp">                            &lt;!-- Popup notification container -->
      <div class="popUpContainer" id="popUpContainer"></div>
    </div>

    <div id="content"></div>                                  &lt;!-- Main content container -->
    <div id="loading" class="loading">                        &lt;!-- Loading indicator -->
      <div class="loading-spinner"></div>
      <span>loading content...</span>
    </div>

    <script src="script.js"></script>                         &lt;!-- Link to JavaScript file -->
  </body>
</html>
````

### CSS (styles.css)

The CSS file defines the visual style of the application with a minimal monochrome theme. Key sections include:

- CSS variables for consistent theming
- Basic reset and global styles
- Header styling with navigation
- Post and comment styling
- Loading indicators and animations
- Responsive design adjustments

### JavaScript (script.js)

#### Constants and State Variables

```javascript
// Constants
const API = "https://hacker-news.firebaseio.com/v0"; // Base URL for Hacker News API
const content = document.getElementById("content"); // Reference to content container
const loading = document.getElementById("loading"); // Reference to loading indicator

// State
let ids = [], // Array to store post IDs
  current = "", // Current category being viewed
  lastNewsId, // ID of the latest news story
  lastJobId; // ID of the latest job posting
let isLoading = false; // Loading state flag
```

#### Utility Functions

```javascript
// Fetch data with error handling
async function fetchData(url) {
  try {
    const response = await fetch(url); // Fetch data from API
    if (!response.ok) throw new Error(`HTTP error ${response.status}`); // Check for HTTP errors
    return await response.json(); // Parse JSON response
  } catch (err) {
    console.error("Fetch error:", err); // Log any errors
    return null; // Return null on error
  }
}

// Format time
const formatTime = (time) => new Date(time * 1000).toLocaleString(); // Convert Unix timestamp to readable date

// Debounce function
const debounce = (callback, delay = 300) => {
  // Prevent function from being called too frequently
  let timer;
  return (...args) => {
    clearTimeout(timer); // Clear previous timer
    timer = setTimeout(() => callback(...args), delay); // Set new timer
  };
};

// Check if near bottom
const isNearBottom = () =>
  // Check if user has scrolled near the bottom
  window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

// Show loading state
const showLoading = (show) => {
  // Toggle loading indicator
  isLoading = show;
  loading.style.display = show ? "flex" : "none";
};

// Show notification
const notify = (message) => {
  // Display notification popup
  const popUp = document.getElementById("popUp");
  document.getElementById("popUpContainer").innerHTML = message; // Set notification message
  popUp.style.display = "block"; // Show popup
  setTimeout(() => (popUp.style.display = "none"), 3000); // Hide after 3 seconds
};
```

#### Core Functionality

```javascript
// Load posts
async function loadPosts(type) {
  if (current === type) return;                                // Skip if already viewing this type
  current = type;                                              // Update current type
  content.innerHTML = "";                                      // Clear content
  showLoading(true);                                           // Show loading indicator

  ids = await fetchData(`${API}/${type}.json`);                // Fetch post IDs for the selected type
  if (!ids) {
    content.innerHTML = "<p>Failed to load posts</p>";         // Show error message if fetch fails
    showLoading(false);
    return;
  }

  if (type === "newstories") lastNewsId = ids[0];              // Store latest news ID
  if (type === "jobstories") lastJobId = ids[0];               // Store latest job ID

  // Load initial batch
  await renderPosts(ids.slice(0, 10));                         // Render first 10 posts
  showLoading(false);                                          // Hide loading indicator
}

// Render posts
async function renderPosts(postIds) {
  if (!postIds?.length) return;                                // Exit if no post IDs
  showLoading(true);                                           // Show loading indicator

  // Add delay to make loading visible
  await new Promise((resolve) => setTimeout(resolve, 500));    // Artificial delay for UX

  const promises = postIds.map(async (id) => {                 // Create array of promises
    const postDiv = document.createElement("div");             // Create container for post
    postDiv.className = "post";
    postDiv.id = `postid-${id}`;
    content.appendChild(postDiv);                              // Add to DOM

    const post = await fetchData(`${API}/item/${id}.json`);    // Fetch post data
    if (post) buildPostDiv(post, postDiv);                     // Build post UI if data exists
    else postDiv.innerHTML = `Failed to load post ${id}`;      // Show error if fetch fails
  });

  await Promise.allSettled(promises);                          // Wait for all posts to load
  showLoading(false);                                          // Hide loading indicator
}

// Build post div
function buildPostDiv(data, div) {
  if (data.deleted) {                                          // Check if post is deleted
    div.innerHTML = "<p>[ UNAVAILABLE CONTENT ]</p>";
    return;
  }

  div.innerHTML = `
    <p class="postTitle">${data.title || "No Title"}</p>       &lt;!-- Post title -->
    <p class="postAuthor">By: ${data.by || "Anonymous"}</p>    &lt;!-- Author name -->
    <p class="postDate">At: ${formatTime(data.time)}</p>       &lt;!-- Formatted timestamp -->
    ${
      data.text
        ? `<p class="postText">${data.text}</p>`               &lt;!-- Post content if available -->
        : `<p class="postText">NO CONTENT</p>`                 &lt;!-- Placeholder if no content -->
    }
    ${
      data.url
        ? `<a class="postUrl" href="${data.url}" target="_blank">Read More</a>` &lt;!-- External link if available -->
        : ""
    }
  `;

  if (data.kids?.length) div.appendChild(buildCommentButton(data.kids)); // Add comments button if comments exist
}

// Build comment button
function buildCommentButton(ids) {
  const container = document.createElement("div");             // Create container for comments
  container.className = "commentContainer";

  const button = document.createElement("button");             // Create toggle button
  button.textContent = "Comments";
  button.dataset.expanded = "false";                           // Track expanded state

  const comments = document.createElement("div");              // Container for comments

  container.appendChild(button);
  container.appendChild(comments);

  button.addEventListener("click", async () => {               // Add click handler
    const isExpanded = button.dataset.expanded === "true";     // Check current state

    if (isExpanded) {
      button.textContent = "Comments";                         // Update button text
      button.dataset.expanded = "false";                       // Update state
      comments.innerHTML = "";                                 // Clear comments
    } else {
      button.textContent = "Hide Comments";                    // Update button text
      button.dataset.expanded = "true";                        // Update state

      if (!ids?.length) {
        comments.innerHTML = "<p>No comments</p>";             // Show message if no comments
      } else {
        showLoading(true);                                     // Show loading indicator
        await renderComments(ids, comments);                   // Render comments
        showLoading(false);                                    // Hide loading indicator
      }
    }
  });

  return container;                                            // Return the comment container
}

// Render comments
async function renderComments(commentIds, container, limit = 10) {
  const idsToRender = commentIds.slice(0, limit);              // Get first batch of comments

  const promises = idsToRender.map(async (id) => {             // Create array of promises
    const commentDiv = document.createElement("div");          // Create container for comment
    commentDiv.className = "comment";
    container.appendChild(commentDiv);                         // Add to DOM

    const comment = await fetchData(`${API}/item/${id}.json`); // Fetch comment data
    if (comment) buildCommentDiv(comment, commentDiv);         // Build comment UI if data exists
    else commentDiv.innerHTML = `Failed to load comment ${id}`; // Show error if fetch fails
  });

  await Promise.allSettled(promises);                          // Wait for all comments to load

  if (commentIds.length > limit) {                             // Check if more comments exist
    const moreButton = document.createElement("button");       // Create "Load More" button
    moreButton.textContent = "Load More";
    container.appendChild(moreButton);                         // Add to DOM

    moreButton.addEventListener("click", async () => {         // Add click handler
      moreButton.remove();                                     // Remove button
      showLoading(true);                                       // Show loading indicator
      await renderComments(commentIds.slice(limit), container); // Load next batch
      showLoading(false);                                      // Hide loading indicator
    });
  }
}

// Build comment div
function buildCommentDiv(data, div) {
  if (data.deleted) {                                          // Check if comment is deleted
    div.innerHTML = "<p>[ DELETED ]</p>";
    return;
  }

  div.innerHTML = `
    <p class="postAuthor">By: ${data.by || "Anonymous"} (${formatTime(
    data.time
  )})</p>                                                      &lt;!-- Author and timestamp -->
    ${data.text ? `<p class="postText">${data.text}</p>` : ""} &lt;!-- Comment text -->
  `;

  if (data.kids?.length) div.appendChild(buildCommentButton(data.kids)); // Add nested comments if they exist
}

// Load more posts
async function loadMorePosts() {
  if (isLoading) return;                                       // Skip if already loading

  const total = content.querySelectorAll(".post").length;      // Count current posts
  const nextBatch = ids.slice(total, total + 10);              // Get next 10 posts

  if (nextBatch.length) {                                      // Check if more posts exist
    showLoading(true);                                         // Show loading indicator
    await renderPosts(nextBatch);                              // Render next batch
    showLoading(false);                                        // Hide loading indicator
  }
}

// Poll demo
async function pollDemo() {
  content.innerHTML = "";                                      // Clear content
  current = "";                                                // Reset current type
  showLoading(true);                                           // Show loading indicator

  const poll = await fetchData(`${API}/item/126809.json`);     // Fetch specific poll (hardcoded ID)
  if (!poll) {
    content.innerHTML = "<p>Failed to load poll</p>";          // Show error if fetch fails
    showLoading(false);
    return;
  }

  const pollDiv = document.createElement("div");               // Create container for poll
  pollDiv.className = "post";
  content.appendChild(pollDiv);                                // Add to DOM
  buildPostDiv(poll, pollDiv);                                 // Build poll UI

  if (poll.parts?.length) {                                    // Check if poll has options
    const partsContainer = document.createElement("div");      // Create container for options
    pollDiv.appendChild(partsContainer);                       // Add to DOM

    const promises = poll.parts.map(async (id) => {            // Create array of promises
      const partDiv = document.createElement("div");           // Create container for option
      partDiv.className = "pollOpt";
      partsContainer.appendChild(partDiv);                     // Add to DOM

      const part = await fetchData(`${API}/item/${id}.json`);  // Fetch option data
      if (part) partDiv.innerHTML = `➡️ ${part.text} (${part.score || 0})`; // Show option with score
      else partDiv.innerHTML = `Failed to load poll option ${id}`; // Show error if fetch fails
    });

    await Promise.allSettled(promises);                        // Wait for all options to load
  }

  showLoading(false);                                          // Hide loading indicator
}

// Check for new posts
async function checkForNewPosts() {
  try {
    const [jobIds, newsIds] = await Promise.all([              // Fetch latest job and news IDs
      fetchData(`${API}/jobstories.json`),
      fetchData(`${API}/newstories.json`),
    ]);

    let message = "";                                          // Initialize notification message

    if (newsIds && newsIds[0] !== lastNewsId) {                // Check for new news stories
      lastNewsId = newsIds[0];                                 // Update latest news ID
      message += "🔔 New stories available!<br>";              // Add to notification message
    }

    if (jobIds && jobIds[0] !== lastJobId) {                   // Check for new job postings
      lastJobId = jobIds[0];                                   // Update latest job ID
      message += "🔔 New jobs posted!<br>";                    // Add to notification message
    }

    if (message) notify(message);                              // Show notification if new content
  } catch (err) {
    console.error("Error checking for new posts:", err);       // Log any errors
  }
}
```

#### Initialization and Event Listeners

```javascript
// Initialize
async function init() {
  // Set up event listeners
  document
    .getElementById("newsButton")
    .addEventListener("click", () => loadPosts("newstories")); // News button click handler
  document
    .getElementById("logo")
    .addEventListener("click", () => loadPosts("newstories")); // Logo click handler
  document
    .getElementById("jobsButton")
    .addEventListener("click", () => loadPosts("jobstories")); // Jobs button click handler
  document.getElementById("pollsButton").addEventListener("click", pollDemo); // Polls button click handler

  // Scroll event for infinite loading
  window.addEventListener(
    "scroll",
    debounce(() => {
      if (
        isNearBottom() && // Check if near bottom
        !isLoading && // Not already loading
        ids.length > content.querySelectorAll(".post").length // More posts available
      ) {
        loadMorePosts(); // Load more posts
      }
    }, 200) // Debounce delay
  );

  // Initial load
  await loadPosts("newstories"); // Load news stories by default

  // Set up polling for new posts
  const jobStories = await fetchData(`${API}/jobstories.json`); // Fetch initial job stories
  if (jobStories) lastJobId = jobStories[0]; // Store latest job ID

  // Check for new posts periodically
  setInterval(checkForNewPosts, 10000); // Check every 10 seconds
}

// Start the app
init(); // Initialize the application
```

## Features

- **Content Categories**: Browse news stories, job postings, and polls
- **Infinite Scrolling**: Automatically loads more content as you scroll
- **Comment Threading**: View and expand nested comments
- **Real-time Updates**: Notifications for new content
- **Responsive Design**: Works on mobile and desktop devices

## How to Use

1. Open `index.html` in a web browser
2. Click on the navigation buttons to switch between content types:

3. **news**: View latest news stories
4. **jobs**: View job postings
5. **polls**: View a sample poll

6. Scroll down to load more content automatically
7. Click "Comments" to view and expand comment threads
8. Receive notifications when new content is available

---

This application uses the official [Hacker News API](https://github.com/HackerNews/API) to fetch real-time data.
