# 🐾 Happy Paws Pet Shop - Sistema POS

Sistema completo de Punto de Venta (POS) para tiendas de mascotas construido con Next.js 15, Prisma, PostgreSQL y shadcn/ui.

## ✨ Características

### 🛒 Punto de Venta (POS)
- Terminal de ventas intuitivo y rápido
- Búsqueda de productos por nombre, SKU o código de barras
- Integración con escáner de código de barras
- Gestión de carrito con cantidades variables
- Aplicación de cupones de descuento
- Múltiples métodos de pago (Efectivo, Tarjeta, Billetera Digital)
- Generación e impresión de recibos
- Deducción automática de inventario

### 📦 Gestión de Productos
- CRUD completo de productos
- Variantes de productos (tamaños, colores, etc.)
- Categorías jerárquicas
- Gestión de precios y costos
- Control de impuestos por producto
- Imágenes de productos

### 📊 Inventario
- Control de stock en tiempo real
- Alertas de stock bajo
- Historial de movimientos (auditoría)
- Ajustes manuales de inventario
- Umbrales de stock personalizables

### 🏷️ Promociones y Descuentos
- Promociones por producto o categoría
- Cupones de descuento (porcentaje o monto fijo)
- Fechas de vigencia
- Límites de uso por cupón

### 📈 Reportes
- Dashboard con estadísticas en tiempo real
- Ventas diarias, semanales y mensuales
- Historial de transacciones
- Exportación de datos

### 👥 Gestión de Usuarios
- Roles: Admin, Manager, Cajero
- Permisos por rol
- Autenticación segura con NextAuth.js

### 🚚 Proveedores
- Gestión de proveedores
- Órdenes de compra
- Seguimiento de entregas

## 🛠️ Tecnologías

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **UI:** shadcn/ui, Tailwind CSS, Lucide Icons
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de datos:** PostgreSQL
- **Autenticación:** NextAuth.js v5 (Auth.js)
- **Forms:** React Hook Form + Zod
- **Gráficos:** Recharts

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd petshop
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env
   DATABASE_URL="postgresql://postgres:yoyo21@localhost:5432/petshop_1?schema=public"
   AUTH_SECRET="your-secret-key-here"
   ```

4. **Crear la base de datos**
   ```bash
   # Ejecutar migraciones
   npx prisma migrate dev
   
   # Poblar datos de ejemplo
   npm run db:seed
   ```

5. **Iniciar el servidor**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 👤 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@petshop.com | admin123 |
| Manager | manager@petshop.com | manager123 |
| Cajero | cashier@petshop.com | cashier123 |

## 📁 Estructura del Proyecto

```
petshop/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos de ejemplo
│   └── migrations/        # Migraciones
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Páginas del dashboard
│   │   │   └── dashboard/
│   │   │       ├── products/
│   │   │       ├── categories/
│   │   │       ├── suppliers/
│   │   │       ├── sales/
│   │   │       └── ...
│   │   ├── api/           # API Routes
│   │   ├── pos/           # Terminal POS
│   │   └── login/         # Página de login
│   ├── components/
│   │   ├── dashboard/     # Componentes del dashboard
│   │   ├── pos/           # Componentes del POS
│   │   └── ui/            # shadcn/ui components
│   └── lib/
│       ├── auth.ts        # Configuración de NextAuth
│       ├── prisma.ts      # Cliente de Prisma
│       └── utils.ts       # Utilidades
└── ...
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Build
npm run build        # Compilar para producción
npm run start        # Iniciar servidor de producción

# Base de datos
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar datos de ejemplo
npm run db:studio    # Abrir Prisma Studio
npm run db:reset     # Resetear base de datos

# Linting
npm run lint         # Ejecutar ESLint
```

## 🔒 Permisos por Rol

| Función | Admin | Manager | Cajero |
|---------|-------|---------|--------|
| Dashboard | ✅ | ✅ | ✅ |
| POS | ✅ | ✅ | ✅ |
| Productos | ✅ | ✅ | ❌ |
| Categorías | ✅ | ✅ | ❌ |
| Proveedores | ✅ | ✅ | ❌ |
| Ventas | ✅ | ✅ | ❌ |
| Promociones | ✅ | ✅ | ❌ |
| Usuarios | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

## 🤝 Contribuir

1. Fork el repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcion`)
3. Commit los cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abrir un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.
