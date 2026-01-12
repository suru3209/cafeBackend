import { prisma } from "../src/utils/prisma";

/**
 * Helper: ₹ → paise
 * Example: ₹80 => 8000
 */
const toPaise = (rupees: number) => Math.round(rupees * 100);

async function main() {
  // ===============================
  // 1️⃣ CATEGORIES
  // ===============================
  const categoryNames = [
    "Smoothies",
    "Juices",
    "Tea",
    "Desserts",
    "Pizza",
    "Burgers",
    "Coffee",
  ];

  const categories = await Promise.all(
    categoryNames.map((name) => {
      const slug = name.toLowerCase().replace(/\s+/g, "-");

      return prisma.category.upsert({
        where: { slug }, // ✅ FIX
        update: {},
        create: {
          name,
          slug,
        },
      });
    })
  );

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.name] = c.id;
  });

  // ===============================
  // 2️⃣ MENU ITEMS
  // ===============================
  const menuItems = [
    // ☕ COFFEE
    {
      name: "Espresso",
      description: "Strong concentrated coffee shot",
      basePrice: 80,
      category: "Coffee",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1510627498534-cf7e9002facc",
    },
    {
      name: "Cappuccino",
      description: "Espresso with steamed milk and foam",
      basePrice: 120,
      category: "Coffee",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1534778101976-62847782c213",
    },
    {
      name: "Latte",
      description: "Smooth espresso with milk",
      basePrice: 130,
      category: "Coffee",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f",
    },
    {
      name: "Cold Coffee",
      description: "Chilled coffee with milk",
      basePrice: 110,
      category: "Coffee",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1571328003758-4a3921661729",
    },
    {
      name: "Cold Coffee with Ice Cream",
      description: "Cold coffee topped with ice cream",
      basePrice: 150,
      category: "Coffee",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1527156231393-7023794f363c",
    },

    // 🍵 TEA
    {
      name: "Masala Tea",
      description: "Indian spiced tea",
      basePrice: 30,
      category: "Tea",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1604908177522-4029f4bb4c48",
    },
    {
      name: "Ginger Tea",
      description: "Tea infused with ginger",
      basePrice: 35,
      category: "Tea",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1678890565859-a2dadf52a48f",
    },
    {
      name: "Green Tea",
      description: "Healthy antioxidant tea",
      basePrice: 40,
      category: "Tea",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1589396575653-8c1e7a19a61f",
    },
    {
      name: "Lemon Tea",
      description: "Refreshing lemon tea",
      basePrice: 35,
      category: "Tea",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1597318180293-3b0b0d2d0e6c",
    },
    {
      name: "Herbal Tea",
      description: "Caffeine-free herbal tea",
      basePrice: 45,
      category: "Tea",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
    },

    // 🥤 JUICES
    {
      name: "Orange Juice",
      description: "Fresh orange juice",
      basePrice: 60,
      category: "Juices",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba",
    },
    {
      name: "Apple Juice",
      description: "Fresh apple juice",
      basePrice: 70,
      category: "Juices",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1571689936048-bb9a7b6e4c3a",
    },
    {
      name: "Pineapple Juice",
      description: "Tropical pineapple juice",
      basePrice: 65,
      category: "Juices",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1571689936048-bb9a7b6e4c3a",
    },
    {
      name: "Mixed Fruit Juice",
      description: "Blend of seasonal fruits",
      basePrice: 75,
      category: "Juices",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1571689936048-bb9a7b6e4c3a",
    },
    {
      name: "Watermelon Juice",
      description: "Refreshing watermelon juice",
      basePrice: 55,
      category: "Juices",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1683531658992-b78c311900a3",
    },

    // 🍓 SMOOTHIES
    {
      name: "Banana Smoothie",
      description: "Creamy banana smoothie",
      basePrice: 90,
      category: "Smoothies",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1685967836529-b0e8d6938227",
    },
    {
      name: "Strawberry Smoothie",
      description: "Fresh strawberry smoothie",
      basePrice: 110,
      category: "Smoothies",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc",
    },
    {
      name: "Mango Smoothie",
      description: "Seasonal mango smoothie",
      basePrice: 120,
      category: "Smoothies",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054",
    },
    {
      name: "Berry Blast Smoothie",
      description: "Mixed berry smoothie",
      basePrice: 140,
      category: "Smoothies",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888",
    },
    {
      name: "Chocolate Smoothie",
      description: "Chocolate flavored smoothie",
      basePrice: 130,
      category: "Smoothies",
      isVeg: true,
      image: "https://images.unsplash.com/photo-1690642109411-89f854ad9aa7",
    },
  ];

  // ===============================
  // 3️⃣ MENU OPTIONS CONFIG
  // ===============================
  const optionsConfig: Record<
    string,
    { name: string; values: string[]; prices: number[] }[]
  > = {
    Coffee: [
      {
        name: "Size",
        values: ["Small", "Medium", "Large"],
        prices: [0, 100, 150], // ✅ RUPEES
      },
      {
        name: "Milk Type",
        values: ["Regular", "Skim", "Almond", "Oat"],
        prices: [0, 0, 30, 30], // ₹30 extra
      },
      {
        name: "Sugar Level",
        values: ["No Sugar", "Low", "Normal"],
        prices: [0, 0, 0],
      },
    ],

    Tea: [
      {
        name: "Size",
        values: ["Small", "Medium", "Large"],
        prices: [0, 50, 80], // ₹50 / ₹80
      },
      {
        name: "Sugar Level",
        values: ["No Sugar", "Normal"],
        prices: [0, 0],
      },
    ],

    Smoothies: [
      {
        name: "Size",
        values: ["Small", "Medium", "Large"],
        prices: [0, 60, 100],
      },
    ],

    Juices: [
      {
        name: "Size",
        values: ["Small", "Medium", "Large"],
        prices: [0, 40, 70],
      },
    ],
  };

  // ===============================
  // 4️⃣ INSERT MENU ITEMS + OPTIONS
  // ===============================
  for (const item of menuItems) {
    const menuItem = await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        basePrice: toPaise(item.basePrice),
        image: item.image,
        categoryId: categoryMap[item.category],
        isVeg: item.isVeg,
        isAvailable: true,
      },
    });

    const options = optionsConfig[item.category];
    if (!options) continue;

    for (const opt of options) {
      const menuOption = await prisma.menuOption.create({
        data: {
          name: opt.name,
          menuItemId: menuItem.id,
        },
      });

      for (let i = 0; i < opt.values.length; i++) {
        await prisma.menuOptionValue.create({
          data: {
            value: opt.values[i],
            priceDelta: toPaise(opt.prices[i]), // ✅ CORRECT
            optionId: menuOption.id,
          },
        });
      }
    }
  }

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
