async function uploadImage() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const outputImage = document.getElementById("outputImage");

  if (!fileInput.files[0]) {
    alert("Please upload an image first!");
    return;
  }

  status.textContent = "Processing...";
  outputImage.src = "";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const response = await fetch("/predict", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.result) {
    status.textContent = "Detection Complete!";
    outputImage.src = data.result + "?t=" + new Date().getTime(); // prevent cache
  } else {
    status.textContent = "Error detecting acne.";
  }
}