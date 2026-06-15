import Swal from "sweetalert2"

export const showMessage=(message:string)=>{
    Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: message,
            timer: 2000,
            showConfirmButton: false,
            background: "#0f172a",
            color: "#e2e8f0",
    });
}