function ResourceItem({ name, length }) {
  return `
    <li>
      <a href="${name}">/${name}</a>
      <sup>${length ? `${length}x` : 'object'}</sup>
    </li>
  `
}

function ResourceList({ db }) {
  return `
    <ul>
      ${Object.keys(db)
        .map((name) =>
          ResourceItem({
            name,
            length: Array.isArray(db[name]) && db[name].length,
          })
        )
        .join('')}
    </ul>
  `
}

function NoResources() {
  return `<p>No resources found</p>`
}

function ResourcesBlock({ db }) {
  return `
    <div>
      <h1>Resources</h1>
      ${Object.keys(db).length ? ResourceList({ db }) : NoResources()}
    </div>
  `
}

window
  .fetch('db')
  .then((response) => response.json())
  .then(
    (db) =>
      (document.getElementById('resources').innerHTML = ResourcesBlock({ db }))
  )

function CustomRoutesBlock({ customRoutes }) {
  const rules = Object.keys(customRoutes)
  if (rules.length) {
    return `
      <div>
        <h1>Custom Routes</h1>
        <table>
          ${rules
            .map(
              (rule) =>
                `<tr>
              <td>${rule}</td>
              <td><code>⇢</code> ${customRoutes[rule]}</td>
            </tr>`
            )
            .join('')}
        </table>
      </div>
    `
  }
}

window
  .fetch('__rules')
  .then((response) => response.json())
  .then(
    (customRoutes) =>
      (document.getElementById('custom-routes').innerHTML = CustomRoutesBlock({
        customRoutes,
      }))
  )

window.fetch('json-server/source')
  .then((res) => res.text())
  .then(source => {
    document.getElementById("source-display").innerText = source
  })

window.fetch('json-server/name')
  .then((res) => res.text())
  .then(data => {
    // document.getElementById("name-title").innerText = data
    document.getElementById("name-display").innerText = data
  })

function showMsg(msg, error = false) {
  const el = document.getElementById("msg-update-db")
  el.innerText = msg
  if (error)
    el.classList.add("error")
  else
    el.classList.remove("error")

}

function showError(msg){
  showMsg(msg,true)
  return msg
}

function uploadFile(){
  let file = document.getElementById("file-upload").files[0]
  const btn = document.getElementById("button-update")

  showMsg("")

  if (!file){
    showError("File not defined")
    return
  }

  btnOriginalValue = btn.value
  btn.disabled = true
  btn.value = "Updating..."

  let formData = new FormData();
      
  formData.append("db", file);
  fetch('db-upload', {method: "POST", body: formData})
    .then((res) => {
      if (res.status == 200)
        showMsg("Success! restarting...")
      waitForRestartAndReload()
    })
    .catch(e => {
      console.log('Error: ', e)
      alert('Upload error ' + e)
    })
}

function waitForRestartAndReload(n_try){
  const maxAttempts = 20
  const waitFor = 500 // in miliseconds

  if (n_try > maxAttempts) {
    console.log(showError(`Max attempts for checking server health has been reached. Try reloading the page manually after a few seconds.`))
    return
  }

  let attempt = n_try || 1
  
  console.log(`Checking the server health... Attempt: ${attempt}`)

  fetch('json-server/source') // Using an endpoint to check health
    .then((data) => location.reload())
    .catch(err => {
      console.log(`The server has not responded to attempt ${attempt}`)
      setTimeout(() => waitForRestartAndReload(++attempt), waitFor)
    })
}