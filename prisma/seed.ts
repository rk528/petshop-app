import { PrismaClient, UserRole, DiscountType, PaymentMethod, InventoryAction } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "bcryptjs";

const connectionString = "postgresql://postgres:yoyo21@localhost:5432/petshop_1?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // Create Users
  console.log("👤 Creating users...");
  const adminPassword = await hash("admin123", 12);
  const managerPassword = await hash("manager123", 12);
  const cashierPassword = await hash("cashier123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@petshop.com",
      name: "Admin User",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@petshop.com",
      name: "Store Manager",
      password: managerPassword,
      role: UserRole.MANAGER,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: "cashier@petshop.com",
      name: "John Cashier",
      password: cashierPassword,
      role: UserRole.CASHIER,
    },
  });

  // Create Suppliers
  console.log("🏭 Creating suppliers...");
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Royal Canin Distributor",
        email: "orders@royalcanin-dist.com",
        phone: "+1-555-0101",
        address: "123 Pet Food Lane",
        city: "Los Angeles",
        country: "USA",
        contactName: "Maria Garcia",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Pet Toys International",
        email: "sales@pettoys.com",
        phone: "+1-555-0102",
        address: "456 Toy Street",
        city: "Miami",
        country: "USA",
        contactName: "Carlos Rodriguez",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Aquarium Supplies Co.",
        email: "info@aquariumsupplies.com",
        phone: "+1-555-0103",
        address: "789 Fish Bowl Ave",
        city: "Seattle",
        country: "USA",
        contactName: "Sarah Chen",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Pet Health Products",
        email: "wholesale@pethealth.com",
        phone: "+1-555-0104",
        address: "321 Medicine Rd",
        city: "Boston",
        country: "USA",
        contactName: "Dr. James Wilson",
      },
    }),
  ]);

  // Create Categories (Hierarchical)
  console.log("📁 Creating categories...");
  
  // Parent Categories
  const dogCategory = await prisma.category.create({
    data: {
      name: "Dogs",
      description: "Everything for your canine friends",
      image: "/categories/dogs.jpg",
    },
  });

  const catCategory = await prisma.category.create({
    data: {
      name: "Cats",
      description: "Everything for your feline friends",
      image: "/categories/cats.jpg",
    },
  });

  const fishCategory = await prisma.category.create({
    data: {
      name: "Fish & Aquarium",
      description: "Aquarium supplies and fish care",
      image: "/categories/fish.jpg",
    },
  });

  const birdsCategory = await prisma.category.create({
    data: {
      name: "Birds",
      description: "Bird supplies and accessories",
      image: "/categories/birds.jpg",
    },
  });

  const smallPetsCategory = await prisma.category.create({
    data: {
      name: "Small Pets",
      description: "Hamsters, rabbits, guinea pigs and more",
      image: "/categories/small-pets.jpg",
    },
  });

  // Sub-categories for Dogs
  const dogFood = await prisma.category.create({
    data: {
      name: "Dog Food",
      description: "Dry, wet, and specialty dog food",
      parentId: dogCategory.id,
    },
  });

  const dogToys = await prisma.category.create({
    data: {
      name: "Dog Toys",
      description: "Toys and playthings for dogs",
      parentId: dogCategory.id,
    },
  });

  const dogHealth = await prisma.category.create({
    data: {
      name: "Dog Health & Grooming",
      description: "Health products and grooming supplies",
      parentId: dogCategory.id,
    },
  });

  const dogAccessories = await prisma.category.create({
    data: {
      name: "Dog Accessories",
      description: "Collars, leashes, beds and more",
      parentId: dogCategory.id,
    },
  });

  // Sub-categories for Cats
  const catFood = await prisma.category.create({
    data: {
      name: "Cat Food",
      description: "Dry, wet, and specialty cat food",
      parentId: catCategory.id,
    },
  });

  const catToys = await prisma.category.create({
    data: {
      name: "Cat Toys",
      description: "Toys and playthings for cats",
      parentId: catCategory.id,
    },
  });

  const catLitter = await prisma.category.create({
    data: {
      name: "Cat Litter & Accessories",
      description: "Litter and litter box supplies",
      parentId: catCategory.id,
    },
  });

  // Sub-categories for Fish
  const fishFood = await prisma.category.create({
    data: {
      name: "Fish Food",
      description: "Food for all types of fish",
      parentId: fishCategory.id,
    },
  });

  const aquariumEquipment = await prisma.category.create({
    data: {
      name: "Aquarium Equipment",
      description: "Filters, pumps, lights and more",
      parentId: fishCategory.id,
    },
  });

  // Create Products
  console.log("📦 Creating products...");
  
  // Dog Food Products
  const royalCaninAdult = await prisma.product.create({
    data: {
      sku: "DOG-FOOD-001",
      barcode: "8710255116921",
      name: "Royal Canin Adult Dog Food",
      description: "Complete nutrition for adult dogs. High-quality protein sources for muscle maintenance.",
      categoryId: dogFood.id,
      supplierId: suppliers[0].id,
      basePrice: 54.99,
      costPrice: 38.00,
      taxRate: 8.00,
      stockQuantity: 50,
      lowStockThreshold: 10,
      unit: "bag",
      image: "/products/royal-canin-adult.jpg",
    },
  });

  // Create variants for Royal Canin
  await prisma.productVariant.createMany({
    data: [
      {
        productId: royalCaninAdult.id,
        sku: "DOG-FOOD-001-SM",
        barcode: "8710255116922",
        name: "Small (2kg)",
        attributes: { size: "2kg", weight: "2000g" },
        priceModifier: -30.00,
        costModifier: -20.00,
        stockQuantity: 30,
      },
      {
        productId: royalCaninAdult.id,
        sku: "DOG-FOOD-001-MD",
        barcode: "8710255116923",
        name: "Medium (7kg)",
        attributes: { size: "7kg", weight: "7000g" },
        priceModifier: 0,
        costModifier: 0,
        stockQuantity: 25,
      },
      {
        productId: royalCaninAdult.id,
        sku: "DOG-FOOD-001-LG",
        barcode: "8710255116924",
        name: "Large (15kg)",
        attributes: { size: "15kg", weight: "15000g" },
        priceModifier: 45.00,
        costModifier: 30.00,
        stockQuantity: 15,
      },
    ],
  });

  const hillsScience = await prisma.product.create({
    data: {
      sku: "DOG-FOOD-002",
      barcode: "052742000121",
      name: "Hill's Science Diet Adult",
      description: "Veterinarian recommended dog food with balanced nutrition.",
      categoryId: dogFood.id,
      supplierId: suppliers[0].id,
      basePrice: 62.99,
      costPrice: 45.00,
      taxRate: 8.00,
      stockQuantity: 35,
      lowStockThreshold: 8,
      unit: "bag",
    },
  });

  // Dog Toys
  const kongClassic = await prisma.product.create({
    data: {
      sku: "DOG-TOY-001",
      barcode: "035585033112",
      name: "KONG Classic Dog Toy",
      description: "Durable rubber toy for hours of chewing fun. Perfect for stuffing with treats.",
      categoryId: dogToys.id,
      supplierId: suppliers[1].id,
      basePrice: 14.99,
      costPrice: 8.50,
      taxRate: 8.00,
      stockQuantity: 100,
      lowStockThreshold: 20,
      unit: "unit",
    },
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: kongClassic.id,
        sku: "DOG-TOY-001-S",
        barcode: "035585033113",
        name: "Small",
        attributes: { size: "Small", forDogSize: "Up to 20 lbs" },
        priceModifier: -3.00,
        costModifier: -2.00,
        stockQuantity: 40,
      },
      {
        productId: kongClassic.id,
        sku: "DOG-TOY-001-M",
        barcode: "035585033114",
        name: "Medium",
        attributes: { size: "Medium", forDogSize: "15-35 lbs" },
        priceModifier: 0,
        costModifier: 0,
        stockQuantity: 35,
      },
      {
        productId: kongClassic.id,
        sku: "DOG-TOY-001-L",
        barcode: "035585033115",
        name: "Large",
        attributes: { size: "Large", forDogSize: "30-65 lbs" },
        priceModifier: 4.00,
        costModifier: 2.50,
        stockQuantity: 25,
      },
    ],
  });

  const ropeToy = await prisma.product.create({
    data: {
      sku: "DOG-TOY-002",
      barcode: "0123456789012",
      name: "Braided Rope Tug Toy",
      description: "Durable cotton rope for interactive play and dental health.",
      categoryId: dogToys.id,
      supplierId: suppliers[1].id,
      basePrice: 9.99,
      costPrice: 4.50,
      taxRate: 8.00,
      stockQuantity: 75,
      lowStockThreshold: 15,
      unit: "unit",
    },
  });

  // Dog Health Products
  const fleaCollar = await prisma.product.create({
    data: {
      sku: "DOG-HEALTH-001",
      barcode: "4007221034674",
      name: "Seresto Flea & Tick Collar",
      description: "8-month protection against fleas and ticks.",
      categoryId: dogHealth.id,
      supplierId: suppliers[3].id,
      basePrice: 58.99,
      costPrice: 42.00,
      taxRate: 8.00,
      stockQuantity: 25,
      lowStockThreshold: 5,
      unit: "unit",
    },
  });

  const dogShampoo = await prisma.product.create({
    data: {
      sku: "DOG-HEALTH-002",
      barcode: "0729849168381",
      name: "Oatmeal Dog Shampoo",
      description: "Gentle, soothing formula for sensitive skin. Made with natural oatmeal.",
      categoryId: dogHealth.id,
      supplierId: suppliers[3].id,
      basePrice: 12.99,
      costPrice: 6.50,
      taxRate: 8.00,
      stockQuantity: 60,
      lowStockThreshold: 12,
      unit: "bottle",
    },
  });

  // Dog Accessories
  const leatherLeash = await prisma.product.create({
    data: {
      sku: "DOG-ACC-001",
      barcode: "0851728004200",
      name: "Premium Leather Leash",
      description: "Handcrafted genuine leather leash with brass hardware.",
      categoryId: dogAccessories.id,
      supplierId: suppliers[1].id,
      basePrice: 34.99,
      costPrice: 18.00,
      taxRate: 8.00,
      stockQuantity: 40,
      lowStockThreshold: 8,
      unit: "unit",
    },
  });

  const dogBed = await prisma.product.create({
    data: {
      sku: "DOG-ACC-002",
      barcode: "0811067013274",
      name: "Orthopedic Memory Foam Dog Bed",
      description: "Premium memory foam bed with removable, washable cover.",
      categoryId: dogAccessories.id,
      supplierId: suppliers[1].id,
      basePrice: 79.99,
      costPrice: 45.00,
      taxRate: 8.00,
      stockQuantity: 20,
      lowStockThreshold: 5,
      unit: "unit",
    },
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: dogBed.id,
        sku: "DOG-ACC-002-S",
        barcode: "0811067013275",
        name: "Small (24x18 in)",
        attributes: { size: "Small", dimensions: "24x18 inches" },
        priceModifier: -25.00,
        costModifier: -15.00,
        stockQuantity: 10,
      },
      {
        productId: dogBed.id,
        sku: "DOG-ACC-002-M",
        barcode: "0811067013276",
        name: "Medium (36x27 in)",
        attributes: { size: "Medium", dimensions: "36x27 inches" },
        priceModifier: 0,
        costModifier: 0,
        stockQuantity: 8,
      },
      {
        productId: dogBed.id,
        sku: "DOG-ACC-002-L",
        barcode: "0811067013277",
        name: "Large (44x34 in)",
        attributes: { size: "Large", dimensions: "44x34 inches" },
        priceModifier: 30.00,
        costModifier: 18.00,
        stockQuantity: 5,
      },
    ],
  });

  // Cat Food Products
  const whiskasCat = await prisma.product.create({
    data: {
      sku: "CAT-FOOD-001",
      barcode: "5000159366625",
      name: "Whiskas Adult Cat Food",
      description: "Complete and balanced nutrition for adult cats.",
      categoryId: catFood.id,
      supplierId: suppliers[0].id,
      basePrice: 28.99,
      costPrice: 18.00,
      taxRate: 8.00,
      stockQuantity: 65,
      lowStockThreshold: 15,
      unit: "bag",
    },
  });

  const fancyFeast = await prisma.product.create({
    data: {
      sku: "CAT-FOOD-002",
      barcode: "0050000573615",
      name: "Fancy Feast Gourmet Wet Food (12-pack)",
      description: "Gourmet wet cat food variety pack with real meat and fish.",
      categoryId: catFood.id,
      supplierId: suppliers[0].id,
      basePrice: 15.99,
      costPrice: 9.50,
      taxRate: 8.00,
      stockQuantity: 80,
      lowStockThreshold: 20,
      unit: "pack",
    },
  });

  // Cat Toys
  const catWand = await prisma.product.create({
    data: {
      sku: "CAT-TOY-001",
      barcode: "0077234022092",
      name: "Interactive Feather Wand",
      description: "Stimulating feather toy on flexible wand for interactive play.",
      categoryId: catToys.id,
      supplierId: suppliers[1].id,
      basePrice: 8.99,
      costPrice: 3.50,
      taxRate: 8.00,
      stockQuantity: 90,
      lowStockThreshold: 18,
      unit: "unit",
    },
  });

  const laserPointer = await prisma.product.create({
    data: {
      sku: "CAT-TOY-002",
      barcode: "0729849160439",
      name: "Cat Laser Pointer Toy",
      description: "Battery-operated laser pointer with multiple patterns.",
      categoryId: catToys.id,
      supplierId: suppliers[1].id,
      basePrice: 6.99,
      costPrice: 2.50,
      taxRate: 8.00,
      stockQuantity: 120,
      lowStockThreshold: 25,
      unit: "unit",
    },
  });

  // Cat Litter
  const tidyCats = await prisma.product.create({
    data: {
      sku: "CAT-LITTER-001",
      barcode: "0070230155269",
      name: "Tidy Cats Clumping Litter",
      description: "Odor-neutralizing, clumping cat litter with instant action.",
      categoryId: catLitter.id,
      supplierId: suppliers[0].id,
      basePrice: 18.99,
      costPrice: 11.00,
      taxRate: 8.00,
      stockQuantity: 45,
      lowStockThreshold: 10,
      unit: "box",
    },
  });

  // Fish Products
  const tetraMin = await prisma.product.create({
    data: {
      sku: "FISH-FOOD-001",
      barcode: "0046798169390",
      name: "TetraMin Tropical Flakes",
      description: "Complete nutrition for all tropical fish. Enhanced with ProCare formula.",
      categoryId: fishFood.id,
      supplierId: suppliers[2].id,
      basePrice: 7.99,
      costPrice: 4.00,
      taxRate: 8.00,
      stockQuantity: 85,
      lowStockThreshold: 20,
      unit: "container",
    },
  });

  const aquariumFilter = await prisma.product.create({
    data: {
      sku: "AQUA-EQUIP-001",
      barcode: "0015561102063",
      name: "Fluval 107 Canister Filter",
      description: "Multi-stage filtration for aquariums up to 30 gallons.",
      categoryId: aquariumEquipment.id,
      supplierId: suppliers[2].id,
      basePrice: 119.99,
      costPrice: 75.00,
      taxRate: 8.00,
      stockQuantity: 12,
      lowStockThreshold: 3,
      unit: "unit",
    },
  });

  const aquariumHeater = await prisma.product.create({
    data: {
      sku: "AQUA-EQUIP-002",
      barcode: "0046798281504",
      name: "Submersible Aquarium Heater 100W",
      description: "Fully submersible heater with automatic temperature control.",
      categoryId: aquariumEquipment.id,
      supplierId: suppliers[2].id,
      basePrice: 24.99,
      costPrice: 14.00,
      taxRate: 8.00,
      stockQuantity: 30,
      lowStockThreshold: 8,
      unit: "unit",
    },
  });

  // Low stock products for testing alerts
  const premiumTreats = await prisma.product.create({
    data: {
      sku: "DOG-TREAT-001",
      barcode: "0071859946078",
      name: "Premium Jerky Treats",
      description: "All-natural beef jerky treats for dogs.",
      categoryId: dogFood.id,
      supplierId: suppliers[0].id,
      basePrice: 12.99,
      costPrice: 7.00,
      taxRate: 8.00,
      stockQuantity: 5, // Low stock!
      lowStockThreshold: 15,
      unit: "bag",
    },
  });

  const catTree = await prisma.product.create({
    data: {
      sku: "CAT-ACC-001",
      barcode: "0655199057580",
      name: "Multi-Level Cat Tree",
      description: "Deluxe cat tree with multiple platforms, scratching posts, and hideaway.",
      categoryId: catCategory.id,
      supplierId: suppliers[1].id,
      basePrice: 129.99,
      costPrice: 70.00,
      taxRate: 8.00,
      stockQuantity: 3, // Low stock!
      lowStockThreshold: 5,
      unit: "unit",
    },
  });

  // Create Promotions
  console.log("🏷️ Creating promotions...");
  const summerSale = await prisma.promotion.create({
    data: {
      name: "Summer Sale",
      description: "20% off all dog food products",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minPurchase: 30.00,
      maxDiscount: 50.00,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  await prisma.promotionProduct.createMany({
    data: [
      { promotionId: summerSale.id, productId: royalCaninAdult.id },
      { promotionId: summerSale.id, productId: hillsScience.id },
    ],
  });

  const catWeek = await prisma.promotion.create({
    data: {
      name: "Cat Week Special",
      description: "$5 off cat toys",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 5,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  await prisma.promotionProduct.createMany({
    data: [
      { promotionId: catWeek.id, productId: catWand.id },
      { promotionId: catWeek.id, productId: laserPointer.id },
    ],
  });

  // Create Coupons
  console.log("🎟️ Creating coupons...");
  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off for new customers",
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        maxDiscount: 25.00,
        maxUses: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        code: "SAVE15",
        description: "$15 off orders over $75",
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 15,
        minPurchase: 75.00,
        maxUses: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        code: "PETLOVER25",
        description: "25% off for VIP customers",
        discountType: DiscountType.PERCENTAGE,
        discountValue: 25,
        maxDiscount: 100.00,
        minPurchase: 100.00,
        maxUses: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create Sample Sales
  console.log("💰 Creating sample sales...");
  const sale1 = await prisma.sale.create({
    data: {
      receiptNumber: "RCP-2024-0001",
      userId: cashier.id,
      subtotal: 74.97,
      taxAmount: 6.00,
      total: 80.97,
      paymentMethod: PaymentMethod.CARD,
      amountPaid: 80.97,
      customerName: "John Doe",
      customerEmail: "john@example.com",
      items: {
        create: [
          {
            productId: royalCaninAdult.id,
            productName: "Royal Canin Adult Dog Food",
            quantity: 1,
            unitPrice: 54.99,
            taxRate: 8.00,
            taxAmount: 4.40,
            total: 59.39,
          },
          {
            productId: kongClassic.id,
            productName: "KONG Classic Dog Toy",
            quantity: 1,
            unitPrice: 14.99,
            taxRate: 8.00,
            taxAmount: 1.20,
            total: 16.19,
          },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      receiptNumber: "RCP-2024-0002",
      userId: cashier.id,
      subtotal: 44.97,
      discountAmount: 4.50,
      taxAmount: 3.24,
      total: 43.71,
      paymentMethod: PaymentMethod.CASH,
      amountPaid: 50.00,
      changeGiven: 6.29,
      items: {
        create: [
          {
            productId: whiskasCat.id,
            productName: "Whiskas Adult Cat Food",
            quantity: 1,
            unitPrice: 28.99,
            taxRate: 8.00,
            taxAmount: 2.32,
            total: 31.31,
          },
          {
            productId: catWand.id,
            productName: "Interactive Feather Wand",
            quantity: 2,
            unitPrice: 8.99,
            discount: 4.50,
            taxRate: 8.00,
            taxAmount: 1.08,
            total: 14.56,
          },
        ],
      },
    },
  });

  // Create Inventory Logs
  console.log("📊 Creating inventory logs...");
  await prisma.inventoryLog.createMany({
    data: [
      {
        productId: royalCaninAdult.id,
        userId: admin.id,
        action: InventoryAction.PURCHASE,
        quantityChange: 50,
        previousQuantity: 0,
        newQuantity: 50,
        reason: "Initial stock purchase",
        referenceType: "purchase",
      },
      {
        productId: royalCaninAdult.id,
        userId: cashier.id,
        action: InventoryAction.SALE,
        quantityChange: -1,
        previousQuantity: 50,
        newQuantity: 49,
        referenceType: "sale",
        referenceId: sale1.id,
      },
      {
        productId: kongClassic.id,
        userId: cashier.id,
        action: InventoryAction.SALE,
        quantityChange: -1,
        previousQuantity: 100,
        newQuantity: 99,
        referenceType: "sale",
        referenceId: sale1.id,
      },
      {
        productId: premiumTreats.id,
        userId: manager.id,
        action: InventoryAction.ADJUSTMENT,
        quantityChange: -10,
        previousQuantity: 15,
        newQuantity: 5,
        reason: "Products expired, removed from inventory",
      },
    ],
  });

  // Create Settings
  console.log("⚙️ Creating settings...");
  await prisma.setting.createMany({
    data: [
      { key: "store_name", value: "Happy Paws Pet Shop", type: "string" },
      { key: "store_address", value: "123 Main Street, Pet City, PC 12345", type: "string" },
      { key: "store_phone", value: "+1 (555) 123-4567", type: "string" },
      { key: "store_email", value: "info@happypaws.com", type: "string" },
      { key: "tax_rate", value: "8", type: "number" },
      { key: "currency", value: "USD", type: "string" },
      { key: "currency_symbol", value: "$", type: "string" },
      { key: "low_stock_alert_enabled", value: "true", type: "boolean" },
      { key: "receipt_footer", value: "Thank you for shopping at Happy Paws! 🐾", type: "string" },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@petshop.com / admin123");
  console.log("   Manager: manager@petshop.com / manager123");
  console.log("   Cashier: cashier@petshop.com / cashier123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
