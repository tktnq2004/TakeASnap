
export type SampleImage = {
  id: string;
  source: any;
};

export type SampleCategory = {
  id: string;
  title: string;
  images: SampleImage[];
};

export const SAMPLE_CATEGORIES: SampleCategory[] = [

  {
    id: "coffee",
    title: "coffee",
    images: [

      {
        id: "coffee-coffee1.jpg",
        source: require("../assets/images/coffee/coffee1.jpg"),
      },

      {
        id: "coffee-coffee2.jpg",
        source: require("../assets/images/coffee/coffee2.jpg"),
      },

      {
        id: "coffee-coffee3.jpg",
        source: require("../assets/images/coffee/coffee3.jpg"),
      },

      {
        id: "coffee-coffee4.jpg",
        source: require("../assets/images/coffee/coffee4.jpg"),
      },

      {
        id: "coffee-coffee5.jpg",
        source: require("../assets/images/coffee/coffee5.jpg"),
      },

      {
        id: "coffee-coffee6.jpg",
        source: require("../assets/images/coffee/coffee6.jpg"),
      },

    ],
  },

  {
    id: "school",
    title: "school",
    images: [

      {
        id: "school-school1.jpg",
        source: require("../assets/images/school/school1.jpg"),
      },

      {
        id: "school-school2.jpg",
        source: require("../assets/images/school/school2.jpg"),
      },

      {
        id: "school-school3.jpg",
        source: require("../assets/images/school/school3.jpg"),
      },

      {
        id: "school-school4.jpg",
        source: require("../assets/images/school/school4.jpg"),
      },

      {
        id: "school-school5.jpg",
        source: require("../assets/images/school/school5.jpg"),
      },

    ],
  },

  {
    id: "street",
    title: "street",
    images: [

      {
        id: "street-street1.jpg",
        source: require("../assets/images/street/street1.jpg"),
      },

      {
        id: "street-street2.jpg",
        source: require("../assets/images/street/street2.jpg"),
      },

      {
        id: "street-street3.jpg",
        source: require("../assets/images/street/street3.jpg"),
      },

      {
        id: "street-street4.jpg",
        source: require("../assets/images/street/street4.jpg"),
      },

      {
        id: "street-street5.jpg",
        source: require("../assets/images/street/street5.jpg"),
      },

      {
        id: "street-street6.jpg",
        source: require("../assets/images/street/street6.jpg"),
      },

      {
        id: "street-street7.jpg",
        source: require("../assets/images/street/street7.jpg"),
      },

    ],
  },

  {
    id: "travel",
    title: "travel",
    images: [

      {
        id: "travel-travel1.jpg",
        source: require("../assets/images/travel/travel1.jpg"),
      },

      {
        id: "travel-travel2.jpg",
        source: require("../assets/images/travel/travel2.jpg"),
      },

      {
        id: "travel-travel3.jpg",
        source: require("../assets/images/travel/travel3.jpg"),
      },

      {
        id: "travel-travel4.jpg",
        source: require("../assets/images/travel/travel4.jpg"),
      },

      {
        id: "travel-travel5.jpg",
        source: require("../assets/images/travel/travel5.jpg"),
      },

      {
        id: "travel-travel6.jpg",
        source: require("../assets/images/travel/travel6.jpg"),
      },

      {
        id: "travel-travel7.jpg",
        source: require("../assets/images/travel/travel7.jpg"),
      },

    ],
  },

];
