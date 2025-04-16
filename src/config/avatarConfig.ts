
export const avatarOptions = [
  {
    id: "avatar1",
    value: "avatar1",
    src: "/lovable-uploads/e6ba8713-6a9f-489c-833b-15043ebdd529.png",
    alt: "Multicolor X logo"
  },
  {
    id: "avatar2",
    value: "avatar2",
    src: "/lovable-uploads/f3556436-66fa-43b9-9118-b334d1ea63c2.png",
    alt: "Dark X logo"
  },
  {
    id: "avatar3",
    value: "avatar3",
    src: "/lovable-uploads/9338fd0a-f3fe-4425-a313-8e202c5f18d7.png",
    alt: "Neon green X logo"
  },
  {
    id: "avatar4",
    value: "avatar4",
    src: "/lovable-uploads/f77ee10e-191a-411e-be23-358ef67cba6f.png",
    alt: "Mint green X logo"
  },
  {
    id: "avatar5",
    value: "avatar5",
    src: "/lovable-uploads/639cc7b7-dd3d-45b5-bc30-cae328cde09b.png",
    alt: "Dark teal X logo"
  }
];

export const getAvatarBySrc = (src: string) => {
  return avatarOptions.find(avatar => avatar.src === src) || avatarOptions[0];
};

export const getAvatarByValue = (value: string) => {
  return avatarOptions.find(avatar => avatar.value === value) || avatarOptions[0];
};
