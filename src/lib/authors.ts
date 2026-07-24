export interface Author {
    name: string;
    bio: string;
    image: string;
    slug: string;
}

export const authors: Record<string, Author> = {
    "Trishul D N": {
        name: "Trishul D N",
        bio: "Trishul is on a mission to solve urban loneliness in India. With a background in NGO, Gender Trainer and AI business, he envisioned City Culture as a way to create meaningful human connections in our fast-paced cities.",
        image: "/images/team/trishul.png",
        slug: "trishul-d-n"
    },
    "Ashwini P": {
        name: "Ashwini P",
        bio: "A tech visionary who believes in using technology to bring people together rather than pull them apart. Ashwini ensures our platform is safe, seamless, and built for scale.",
        image: "/images/team/priya.png",
        slug: "ashwini-p"
    }
};

export function getAuthor(name: string): Author | undefined {
    return authors[name];
}

export function getAllAuthors(): Author[] {
    return Object.values(authors);
}