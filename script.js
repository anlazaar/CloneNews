// Constants
const API = "https://hacker-news.firebaseio.com/v0";
const content = document.getElementById("content");
const loading = document.getElementById("loading");

// State
let ids = [],
  current = "",
  lastNewsId,
  lastJobId;
let isLoading = false;

// Fetch data with error handling
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// Format time
const formatTime = (time) => {
  // console.log(time);
  return new Date(time * 1000).toLocaleString();
};

// Debounce function
const debounce = (callback, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
};

// Check if near bottom
const isNearBottom = () =>
  parseInt(window.innerHeight + window.scrollY + 1) >=
  document.body.offsetHeight;

// Show loading state
const showLoading = (show) => {
  isLoading = show;
  loading.style.display = show ? "flex" : "none";
};

// Show notification
const notify = (message) => {
  const popUp = document.getElementById("popUp");
  document.getElementById("popUpContainer").innerHTML = message;
  popUp.style.display = "block";
  setTimeout(() => (popUp.style.display = "none"), 3000);
};

// Load posts
async function loadPosts(type) {
  if (current === type) return;
  current = type;
  content.innerHTML = "";
  showLoading(true);

  ids = await fetchData(`${API}/${type}.json`);
  if (!ids) {
    content.innerHTML = "<p>Failed to load posts</p>";
    showLoading(false);
    return;
  }

  if (type === "newstories") lastNewsId = ids[0];
  if (type === "jobstories") lastJobId = ids[0];

  // Load initial batch
  await renderPosts(ids.slice(0, 10));
  showLoading(false);
}

// Render posts
async function renderPosts(postIds) {
  if (!postIds?.length) return;
  showLoading(true);

  // Add delay to make loading visible
  await new Promise((resolve) => setTimeout(resolve, 500));

  const promises = postIds.map(async (id) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.id = `postid-${id}`;
    content.appendChild(postDiv);

    const post = await fetchData(`${API}/item/${id}.json`);
    if (post) buildPostDiv(post, postDiv);
    else postDiv.innerHTML = `Failed to load post ${id}`;
  });

  await Promise.allSettled(promises);
  showLoading(false);
}

// Build post div
function buildPostDiv(data, div) {
  if (data.deleted) {
    div.innerHTML = "<p>[ UNAVAILABLE CONTENT ]</p>";
    return;
  }

  div.innerHTML = `
    <p class="postTitle">${data.title || "No Title"}</p>
    <p class="postAuthor">By: ${data.by || "Anonymous"}</p>
    <p class="postDate">At: ${formatTime(data.time)}</p>
    ${
      data.text
        ? `<p class="postText">${data.text}</p>`
        : `<p class="postText">NO CONTENT</p>`
    }
    ${
      data.url
        ? `<a class="postUrl" href="${data.url}" target="_blank">Read More</a>`
        : ""
    }
  `;

  if (data.kids?.length) div.appendChild(buildCommentButton(data.kids));
}

// Build comment button
function buildCommentButton(ids) {
  const container = document.createElement("div");
  container.className = "commentContainer";

  const button = document.createElement("button");
  button.textContent = "Comments";
  button.dataset.expanded = "false";

  const comments = document.createElement("div");

  container.appendChild(button);
  container.appendChild(comments);

  button.addEventListener("click", async () => {
    const isExpanded = button.dataset.expanded === "true";

    if (isExpanded) {
      button.textContent = "Comments";
      button.dataset.expanded = "false";
      comments.innerHTML = "";
    } else {
      button.textContent = "Hide Comments";
      button.dataset.expanded = "true";

      if (!ids?.length) {
        comments.innerHTML = "<p>No comments</p>";
      } else {
        showLoading(true);
        await renderComments(ids, comments);
        showLoading(false);
      }
    }
  });

  return container;
}

// Render comments
async function renderComments(commentIds, container, limit = 10) {
  const idsToRender = commentIds.slice(0, limit);

  const promises = idsToRender.map(async (id) => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    container.appendChild(commentDiv);

    const comment = await fetchData(`${API}/item/${id}.json`);
    if (comment) buildCommentDiv(comment, commentDiv);
    else commentDiv.innerHTML = `Failed to load comment ${id}`;
  });

  await Promise.allSettled(promises);

  if (commentIds.length > limit) {
    const moreButton = document.createElement("button");
    moreButton.textContent = "Load More";
    container.appendChild(moreButton);

    moreButton.addEventListener("click", async () => {
      moreButton.remove();
      showLoading(true);
      await renderComments(commentIds.slice(limit), container);
      showLoading(false);
    });
  }
}

// Build comment div
function buildCommentDiv(data, div) {
  if (data.deleted) {
    div.innerHTML = "<p>[ DELETED ]</p>";
    return;
  }

  div.innerHTML = `
    <p class="postAuthor">By: ${data.by || "Anonymous"} (${formatTime(
    data.time
  )})</p>
    ${data.text ? `<p class="postText">${data.text}</p>` : ""}
  `;

  if (data.kids?.length) div.appendChild(buildCommentButton(data.kids));
}

// Load more posts
async function loadMorePosts() {
  if (isLoading) return;

  const total = content.querySelectorAll(".post").length;
  const nextBatch = ids.slice(total, total + 10);

  if (nextBatch.length) {
    showLoading(true);
    await renderPosts(nextBatch);
    showLoading(false);
  }
}

// Poll demo
async function pollDemo() {
  content.innerHTML = "";
  current = "";
  showLoading(true);

  const poll = await fetchData(`${API}/item/126809.json`);
  if (!poll) {
    content.innerHTML = "<p>Failed to load poll</p>";
    showLoading(false);
    return;
  }

  const pollDiv = document.createElement("div");
  pollDiv.className = "post";
  content.appendChild(pollDiv);
  buildPostDiv(poll, pollDiv);

  if (poll.parts?.length) {
    const partsContainer = document.createElement("div");
    pollDiv.appendChild(partsContainer);

    const promises = poll.parts.map(async (id) => {
      const partDiv = document.createElement("div");
      partDiv.className = "pollOpt";
      partsContainer.appendChild(partDiv);

      const part = await fetchData(`${API}/item/${id}.json`);
      if (part) partDiv.innerHTML = `➡️ ${part.text} (${part.score || 0})`;
      else partDiv.innerHTML = `Failed to load poll option ${id}`;
    });

    await Promise.allSettled(promises);
  }

  showLoading(false);
}

// Check for new posts
async function checkForNewPosts() {
  try {
    const [jobIds, newsIds] = await Promise.all([
      fetchData(`${API}/jobstories.json`),
      fetchData(`${API}/newstories.json`),
    ]);

    let message = "";

    if (newsIds && newsIds[0] !== lastNewsId) {
      lastNewsId = newsIds[0];
      message += "🔔 New stories available!<br>";
    }

    if (jobIds && jobIds[0] !== lastJobId) {
      lastJobId = jobIds[0];
      message += "🔔 New jobs posted!<br>";
    }

    if (message) notify(message);
  } catch (err) {
    console.error("Error checking for new posts:", err);
  }
}

// Initialize
async function init() {
  // Set up event listeners
  document
    .getElementById("newsButton")
    .addEventListener("click", () => loadPosts("newstories"));
  document
    .getElementById("logo")
    .addEventListener("click", () => loadPosts("newstories"));
  document
    .getElementById("jobsButton")
    .addEventListener("click", () => loadPosts("jobstories"));
  document.getElementById("pollsButton").addEventListener("click", pollDemo);

  // Scroll event for infinite loading
  window.addEventListener(
    "scroll",
    debounce(() => {
      if (
        isNearBottom() &&
        !isLoading &&
        ids.length > content.querySelectorAll(".post").length
      ) {
        loadMorePosts();
      }
    }, 200)
  );

  // Initial load
  await loadPosts("newstories");

  // Set up polling for new posts
  const jobStories = await fetchData(`${API}/jobstories.json`);
  if (jobStories) lastJobId = jobStories[0];

  // Check for new posts periodically
  setInterval(checkForNewPosts, 10000);
}

// Start the app
init();
