import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css']
})
export class UserDetail implements OnInit {
  extensiones = [
    '+52', '+1', '+44', '+33', '+49', '+34',
    '+55', '+54', '+81', '+82', '+86'
  ];

  telefonoExtension = '+52';
  user: any = null;
  pago: any = null; 
  clave_usuario!: string;

  busqueda: string = '';
  resultadosBusqueda: any[] = [];

  sede = localStorage.getItem('sede')?.split(',') || [];


  toast = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error'
  };


  showToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.mensaje = mensaje;
    this.toast.tipo = tipo;
    this.toast.visible = true;

    // Se oculta automáticamente tras 3 segundos
    setTimeout(() => {
      this.toast.visible = false;
    }, 3000);
  }

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.clave_usuario = String(this.route.snapshot.paramMap.get('clave_usuario'));

    this.cargarUsuario(this.clave_usuario);
    this.cargarPago(this.clave_usuario);
  }

  cargarUsuario(clave_usuario: string) {
    this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
      next: (data) => {
        this.user = data;

        // Mostrar imagen
        this.user.ruta_imagen_mostrar = this.user.ruta_imagen
          ? `${environment.apiUrl}/${this.user.ruta_imagen}`
          : null;

        this.user.sede = this.sede[0];

        if (this.user.telefono) {
          const partes = this.user.telefono.split(" ");

          // Si viene "+52 1234567890"
          if (partes.length > 1) {
            this.telefonoExtension = partes[0];    // "+52"
            this.user.telefono = partes.slice(1).join(" "); // "1234567890"
          } else {
            // Si viene sin extensión
            this.user.telefono = this.user.telefono.replace(/\D/g, '');
          }
        }

        if (this.user.peso_inicial) {
          this.user.peso_inicial = this.user.peso_inicial
            .toString()
            .replace(/kg/i, '')     // Quitar "kg" sin importar mayúsculas
            .trim();
        }
      }
    });
  }

buscar() {
    const termino = this.busqueda.trim();
    if (termino.length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    // Enviamos el término tal cual; el backend debería usar LIKE case-insensitive.
    // Si tu backend es estrictamente sensible, podrías usar termino.toUpperCase()
    this.usuarioService.buscarUsuariosDeSede(termino, this.user?.sede || this.sede[0]).subscribe({
      next: (data: any[]) => {
        this.resultadosBusqueda = data;
      },
      error: () => { this.resultadosBusqueda = []; }
    });
  }

  seleccionarUsuario(usuario: any) {
    this.resultadosBusqueda = [];
    this.busqueda = '';
    this.clave_usuario = usuario.clave_usuario;

    this.cargarUsuario(this.clave_usuario);
    this.cargarPago(this.clave_usuario);
  }

  cargarPago(clave_usuario: string) {
      this.usuarioService.getPagosByClave(clave_usuario).subscribe({
          next: (data) => {
              this.pago = data || null;
          },
          error: (err) => {
              // Si es 404 simplemente lo ignoramos, es un usuario nuevo sin pago
              if (err.status === 404) {
                  this.pago = null;
              } else {
                  console.error("Error al cargar pago:", err);
              }
          }
      });
  }
  guardarCambios() {
      const hoy = new Date();

      // 1. Limpieza de datos (Evitar error de trim)
      let pesoVal = String(this.user.peso_inicial ?? '').trim();
      if (pesoVal !== '' && !pesoVal.toLowerCase().includes('kg')) {
          pesoVal = `${pesoVal} Kg`;
      }
      this.user.peso_inicial = pesoVal;

      this.user.nombres = this.user.nombres?.trim().toLowerCase() || '';
      this.user.apellidos = this.user.apellidos?.trim().toLowerCase() || '';

      const numeroSolo = String(this.user.telefono ?? '').replace(/\D/g, '');
      this.user.telefono = this.telefonoExtension ? `${this.telefonoExtension} ${numeroSolo}` : numeroSolo;

      const usuarioActualizado = { ...this.user };
      if (!this.user.password || this.user.password.trim() === '') {
          delete usuarioActualizado.password;
      }

      // ==========================================================
      // LÓGICA DE PAGOS SEGÚN STATUS
      // ==========================================================
      
      // CASO A: Es un cliente NUEVO (Status "sin asignar")
      // Opcional: También verificamos si NO tiene un registro de pago previo (!this.pago)
      if (this.user.status === 'sin asignar' || !this.pago) {
          console.log("Detectado como cliente nuevo. Generando pago inicial de 500...");
          
          const { fechaPago, tipo_pago } = this.calcularFechaPago(hoy);

          const dataPago = {
              clave_cliente: this.clave_usuario,
              fecha_ingreso: this.formatLocalDate(hoy),
              fecha_corte: this.formatLocalDate(fechaPago),
              Tipo_pago: tipo_pago,
              monto_pendiente: 500 // Monto fijo para nuevos
          };

          // Cambiamos el status a 'activo' automáticamente al generar el pago si quieres, 
          // o lo dejamos como tú prefieras. Aquí lo mando a actualizar:
          this.usuarioService.registrarPago(dataPago).subscribe({
              next: () => {
                  // Una vez creado el pago, actualizamos los datos del usuario
                  this.actualizarUsuario(usuarioActualizado);
              },
              error: (err) => {
                  console.error(err);
                  alert("Error al registrar el pago inicial.");
              }
          });

      } else {
          // CASO B: Es un cliente EXISTENTE
          // Solo actualizamos sus datos de perfil, el precio de su mensualidad no se toca
          console.log("Cliente existente. Actualizando solo perfil...");
          this.actualizarUsuario(usuarioActualizado);
      }
  }

  actualizarUsuario(usuarioActualizado: any) {
      this.usuarioService.actualizarUsuario(this.clave_usuario, usuarioActualizado)
        .subscribe({
          next: () => {
            this.showToast("Datos guardados correctamente", "success");
          },
          error: () => this.showToast("Error al actualizar usuario", "error")
        });
    }

  subirFoto(event: any) {
      const archivo = event.target.files[0];
      if (!archivo) return;

      const formData = new FormData();
      formData.append('foto', archivo);

      this.usuarioService.subirFoto(this.clave_usuario, formData)
        .subscribe({
          next: (resp: any) => {
            this.user.ruta_imagen = resp.ruta_imagen;
            this.user.ruta_imagen_mostrar = `${environment.apiUrl}/${resp.ruta_imagen}`;
            this.showToast("Foto de perfil actualizada", "success");
          },
          error: () => this.showToast("Error al subir la foto", "error")
        });
    }

  private formatLocalDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2,'0');
    const d = String(fecha.getDate()).padStart(2,'0');
    const h = String(fecha.getHours()).padStart(2,'0');
    const min = String(fecha.getMinutes()).padStart(2,'0');
    const s = String(fecha.getSeconds()).padStart(2,'0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }

  private calcularFechaPago(fecha: Date): { fechaPago: Date, tipo_pago: string } {
    const day = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    let fechaPago: Date;
    let tipo_pago: string;

    if ((day >= 1 && day <= 6) || day >= 28) {
      fechaPago = day >= 28 ? new Date(anio, mes + 1, 1) : new Date(anio, mes, 1);
      tipo_pago = 'Mensual';
    } else if (day >= 15 && day <= 21) {
      fechaPago = new Date(anio, mes, 15);
      tipo_pago = 'Quincenal';
    } else {
      fechaPago = new Date(anio, mes + 1, 1);
      tipo_pago = 'Mensual';
    }

    return { fechaPago, tipo_pago };
  }

  
}
