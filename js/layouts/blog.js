const initLinkTo = () => {
  const dataLinks = document.querySelectorAll(".js--link-to");

  dataLinks.forEach((element) => {
    const link = element;
    link.onclick = function (e) {
      if (e.target.href == undefined) {
        window.location = link.dataset.link;
      }
    };
  });
};

const initGoBack = () => {
  const goBackLinks = document.querySelectorAll(".js--go-back");

  goBackLinks.forEach((element) => {
    const link = element;
    link.onclick = function (e) {
      if (document.referrer.indexOf(window.location.host) !== -1) {
        history.go(-1); return false;
      } else {
        window.location.href = '/';
      }
    };
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initLinkTo();
  initGoBack();
});
