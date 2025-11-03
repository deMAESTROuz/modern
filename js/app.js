const toggleBtn = document.getElementById("toggleCreators");
const creatorsBox = document.getElementById("creatorsBox");
const icon = toggleBtn.querySelector("i");

toggleBtn.addEventListener("click", () => {
    creatorsBox.classList.toggle("active");

    if (creatorsBox.classList.contains("active")) {
        icon.classList.remove("fa-plus");
        icon.classList.add("fa-minus");
    } else {
        icon.classList.remove("fa-minus");
        icon.classList.add("fa-plus");
    }
});

