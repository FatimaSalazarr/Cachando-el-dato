export function showAppAlert({ icon, title, text }) {
  if (!window.Swal) {
    throw new Error('No se pudo cargar SweetAlert2.');
  }

  return window.Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: 'ENTENDIDO',
    buttonsStyling: false,
    customClass: {
      popup: 'app-swal-popup',
      title: 'app-swal-title',
      confirmButton: 'app-swal-confirm'
    }
  });
}
