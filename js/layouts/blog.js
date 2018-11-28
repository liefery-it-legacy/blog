const initLinkTo = () => {
  const dataLinks = document.querySelectorAll(".js--link-to");

  console.log(dataLinks);

  dataLinks.forEach((element) => {
    const link = element;
    link.onclick = function (e) {
      window.location = link.dataset.link;
    };
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initLinkTo();
});
