/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMatchingOffers } from "@/lib/matching";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";
import UserRanking from "@/lib/models/UserRanking";

jest.mock("@/lib/models/Book", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("@/lib/models/User", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("@/lib/models/UserRanking", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("@/lib/db/connect", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("getMatchingOffers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty list if user or wishlist not found", async () => {
    (User.findOne as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const results = await getMatchingOffers("test@example.com");
    expect(results).toEqual([]);
  });

  it("should match books based on wishlist titles", async () => {
    const mockUser = {
      _id: "user1",
      wishlist: [{ title: "The Hobbit" }],
    };

    const mockBook = {
      _id: "book1",
      title: "The Hobbit",
      owner: { _id: "owner1", username: "owner1" },
      status: "available",
    };

    (User.findOne as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser as any),
    });

    (Book.find as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockBook] as any),
    });

    (UserRanking.find as unknown as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([] as any),
    });

    const results = await getMatchingOffers("test@example.com");
    expect(results).toHaveLength(1);
    expect(results[0].offeredBook.title).toBe("The Hobbit");
    expect(results[0].matchScore).toBe(100);
  });

  it("should prioritize Platinum users over Gold users", async () => {
    const mockUser = {
      _id: "user1",
      wishlist: [{ title: "Book A" }],
    };

    const bookPlatinum = {
      _id: "bookP",
      title: "Book A",
      owner: { _id: "ownerP", username: "PlatinumOwner" },
      status: "available",
    };

    const bookGold = {
      _id: "bookG",
      title: "Book A",
      owner: { _id: "ownerG", username: "GoldOwner" },
      status: "available",
    };

    (User.findOne as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser as any),
    });

    (Book.find as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([bookGold, bookPlatinum] as any),
    });

    (UserRanking.find as unknown as jest.Mock).mockReturnValue({
      lean: jest.fn().mockImplementation(() =>
        Promise.resolve([
          { userId: "ownerP", tier: "platinum", rank: 10 },
          { userId: "ownerG", tier: "gold", rank: 5 },
        ] as any),
      ),
    });

    const results = await getMatchingOffers("test@example.com");
    expect(results).toHaveLength(2);
    expect(results[0].owner.username).toBe("PlatinumOwner");
    expect(results[1].owner.username).toBe("GoldOwner");
  });

  it("should sort by matchScore then ownerRank if tiers are equal", async () => {
    const mockUser = {
      _id: "user1",
      wishlist: [{ title: "Book A" }, { title: "Book B" }],
    };

    const bookRank10 = {
      _id: "b1",
      title: "Book A",
      owner: { _id: "o1", username: "Rank10" },
      status: "available",
    };
    const bookRank1 = {
      _id: "b2",
      title: "Book A",
      owner: { _id: "o2", username: "Rank1" },
      status: "available",
    };

    (User.findOne as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser as any),
    });

    (Book.find as unknown as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([bookRank10, bookRank1] as any),
    });

    (UserRanking.find as unknown as jest.Mock).mockReturnValue({
      lean: jest.fn().mockImplementation(() =>
        Promise.resolve([
          { userId: "o1", tier: "silver", rank: 10 },
          { userId: "o2", tier: "silver", rank: 1 },
        ] as any),
      ),
    });

    const results = await getMatchingOffers("test@example.com");
    expect(results[0].owner._id).toBe("o2");
    expect(results[1].owner._id).toBe("o1");
  });
});
