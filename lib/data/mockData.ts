const mockBooks = Array.from({ length: 50 }, (_, i) => ({
  id: `book-${i}`,
  title: `Książka ${i + 1}`,
  author: `Autor ${i % 10}`,
  image: `/professional-avatar.png`,
  description: `Opis książki ${i + 1}`,
  status: ["new", "used", "damaged"][i % 3] as "new" | "used" | "damaged",
  location: ["Warszawa", "Kraków", "Gdańsk"][i % 3],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(), // najnowsze najpierw
  owner: { name: `Użytkownik ${i % 5}`, email: `user${i % 5}@example.com` },
}));

const mockMatches = [
  {
    offeredBook: mockBooks[0],
    owner: mockBooks[0].owner,
    matchType: "wishlist",
  },
  {
    offeredBook: mockBooks[1],
    owner: mockBooks[1].owner,
    matchType: "wishlist",
  },
];

export { mockBooks, mockMatches };
