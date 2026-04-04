import { prisma } from "../src/lib/prisma";

const vietnamCities = [
  "Hà Nội",
  "Thành phố Hồ Chí Minh",
  "Hải Phòng",
  "Đà Nẵng",
  "Cần Thơ",
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Tĩnh",
  "Hải Dương",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

function normalizeCityName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function seedCities() {
  const existing = await prisma.city.findMany({
    select: { city_id: true, name: true },
  });

  const existingByNormalizedName = new Map(
    existing.map((city) => [normalizeCityName(city.name), city]),
  );

  const citiesToInsert: string[] = [];
  const citiesToUpdate: Array<{ city_id: number; name: string }> = [];

  for (const cityName of vietnamCities) {
    const normalizedName = normalizeCityName(cityName);
    const matchedCity = existingByNormalizedName.get(normalizedName);

    if (!matchedCity) {
      citiesToInsert.push(cityName);
      continue;
    }

    if (matchedCity.name !== cityName) {
      citiesToUpdate.push({ city_id: matchedCity.city_id, name: cityName });
    }
  }

  if (citiesToInsert.length === 0 && citiesToUpdate.length === 0) {
    console.log(
      "City table already contains all 63 Vietnamese cities/provinces.",
    );
    return;
  }

  if (citiesToInsert.length > 0) {
    await prisma.city.createMany({
      data: citiesToInsert.map((name) => ({ name })),
    });
  }

  if (citiesToUpdate.length > 0) {
    await Promise.all(
      citiesToUpdate.map((city) =>
        prisma.city.update({
          where: { city_id: city.city_id },
          data: { name: city.name },
        }),
      ),
    );
  }

  console.log(
    `Inserted ${citiesToInsert.length} and updated ${citiesToUpdate.length} cities/provinces in City table.`,
  );
}

seedCities()
  .catch((error) => {
    console.error("Failed to seed cities:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
