
export const avatarOptions = [
  {
    id: "avatar1",
    value: "avatar1",
    src: "/lovable-uploads/0d79bf27-1645-4a1d-b27c-c52a2d5a8eac.png",
    alt: "Multi-color X logo with circular design"
  },
  {
    id: "avatar2",
    value: "avatar2",
    src: "/lovable-uploads/b5feb8cf-9f99-4d10-a84e-81ebfdecb7cb.png",
    alt: "Dark teal X logo with circular design"
  },
  {
    id: "avatar3",
    value: "avatar3",
    src: "/lovable-uploads/ecc5d24f-e08e-495a-8bbc-5d7901783c3e.png",
    alt: "Navy X logo with circular design"
  },
  {
    id: "avatar4",
    value: "avatar4",
    src: "/lovable-uploads/afabb846-16f9-4570-bd28-490cd59a9e9d.png",
    alt: "Neon green X logo with circular design"
  },
  {
    id: "avatar5",
    value: "avatar5",
    src: "/lovable-uploads/14a6b3b2-3a74-4460-84fe-ae743b3b7849.png",
    alt: "Mint green X logo with circular design"
  }
];

export const getAvatarBySrc = (src: string) => {
  return avatarOptions.find(avatar => avatar.src === src) || avatarOptions[0];
};

export const getAvatarByValue = (value: string) => {
  return avatarOptions.find(avatar => avatar.value === value) || avatarOptions[0];
};

