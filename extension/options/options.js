function getOptions() {

  const setInput = data => document.querySelector("#isEnabled").value = data.isEnabled;

  // const onError = err => console.log(`Error: ${err}`);

  let data = browser.storage.local.get('isEnabled');
  data.then(setInput);
  // data.then(setInput, onError);
}

document.addEventListener("DOMContentLoaded", getOptions);
