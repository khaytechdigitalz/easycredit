// ----------------------------------------------------------------------

function path(root: string, sublink: string) {
  return `${root}${sublink}`;
}

const ROOTS_AUTH = '/auth';
const ROOTS_DASHBOARD = '/dashboard';
const ROOTS_ADMIN = '/admin';

// ----------------------------------------------------------------------

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, '/login'),
  register: path(ROOTS_AUTH, '/register'),
  loginUnprotected: path(ROOTS_AUTH, '/login-unprotected'),
  registerUnprotected: path(ROOTS_AUTH, '/register-unprotected'),
  verify: path(ROOTS_AUTH, '/verify'),
  resetPassword: path(ROOTS_AUTH, '/reset-password'),
  newPassword: path(ROOTS_AUTH, '/new-password'),
};

export const PATH_PAGE = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/403',
  page404: '/404',
  page500: '/500',
  components: '/components',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  kanban: path(ROOTS_DASHBOARD, '/kanban'),
  calendar: path(ROOTS_DASHBOARD, '/calendar'),
  fileManager: path(ROOTS_DASHBOARD, '/files-manager'),
  permissionDenied: path(ROOTS_DASHBOARD, '/permission-denied'),
  blank: path(ROOTS_DASHBOARD, '/blank'),
  general: {
    app: path(ROOTS_DASHBOARD, '/app'),
    ecommerce: path(ROOTS_DASHBOARD, '/ecommerce'),
    analytics: path(ROOTS_DASHBOARD, '/analytics'),
    banking: path(ROOTS_DASHBOARD, '/banking'),
    booking: path(ROOTS_DASHBOARD, '/booking'),
    file: path(ROOTS_DASHBOARD, '/file'),
  },


  accounting: {
    root: path(ROOTS_DASHBOARD, '/accounting'),
    view: path(ROOTS_ADMIN, '/accounting/chart_of_account'),
    journal: path(ROOTS_ADMIN, '/accounting/journal_entry'),
  },

  bills: {
    root: path(ROOTS_DASHBOARD, '/bills'),
    history: path(ROOTS_ADMIN, '/bills/history'),
  },

  contact: {
    root: path(ROOTS_DASHBOARD, '/contact'),
    index: path(ROOTS_ADMIN, '/contact/manage'),
  },

  tier: {
    root: path(ROOTS_DASHBOARD, '/tier'),
    index: path(ROOTS_ADMIN, '/tier/manage'),
  },

  transfer: {
    root: path(ROOTS_DASHBOARD, '/transfer'),
    bank: path(ROOTS_ADMIN, '/transfer/bank'),
    user: path(ROOTS_ADMIN, '/transfer/user'),
  },

  loan: {
    root: path(ROOTS_DASHBOARD, '/loan'),
    applications: path(ROOTS_ADMIN, '/loan/applications'),
    view: (id: string) =>  path(ROOTS_ADMIN, `/loan/${id}`),
    product: path(ROOTS_ADMIN, '/loan/product'),
    purpose: path(ROOTS_ADMIN, '/loan/purpose'),
    purpose_create: path(ROOTS_ADMIN, '/loan/purpose_create'),

    create_product: path(ROOTS_ADMIN, '/loan/create_product'),
    loans: path(ROOTS_ADMIN, '/loan/loans'),
    create_new_loan: path(ROOTS_ADMIN, '/loan/create_loan'),

    create: path(ROOTS_ADMIN, '/loan/create'),
    repayments: path(ROOTS_ADMIN, '/loan/repayments'),
    repayment_bulk: path(ROOTS_ADMIN, '/loan/repayment_bulk'),
    charges: path(ROOTS_ADMIN, '/loan/charges'),
    charge_new: path(ROOTS_ADMIN, '/loan/charge_new'),
    calculator: path(ROOTS_ADMIN, '/loan/calculator'),
    register: path(ROOTS_ADMIN, '/loan/register'),
    register_new: path(ROOTS_ADMIN, '/loan/register_new'),
    provision: path(ROOTS_ADMIN, '/loan/provision'),
    provision_new: path(ROOTS_ADMIN, '/loan/provision_new'),
  },

  branch: {
    root: path(ROOTS_DASHBOARD, '/branch'),
    list: path(ROOTS_ADMIN, '/branch/list'),
    create: path(ROOTS_ADMIN, '/branch/create'),
  },

  complaint: {
    root: path(ROOTS_DASHBOARD, '/complaint'),
    manage: path(ROOTS_ADMIN, '/complaint/complaints'),
    category: path(ROOTS_ADMIN, '/complaint/category'),
    categorycreate: path(ROOTS_ADMIN, '/complaint/categorycreate'),
  },

  faq: {
    root: path(ROOTS_DASHBOARD, '/faq'),
    list: path(ROOTS_ADMIN, '/faq/list'),
    create: path(ROOTS_ADMIN, '/faq/create'),
  },


  client: {
    root: path(ROOTS_DASHBOARD, '/client/'),
    list: path(ROOTS_ADMIN, '/client/list'),
    view: (id: string) =>  path(ROOTS_ADMIN, `/client/${id}`),
    create: path(ROOTS_ADMIN, '/client/create'),
  },

  communication: {
    root: path(ROOTS_DASHBOARD, '/communication'),
    list: path(ROOTS_ADMIN, '/communication/list'),
    create: path(ROOTS_ADMIN, '/communication/create'),
    log: path(ROOTS_ADMIN, '/communication/log'),
    gateway: path(ROOTS_ADMIN, '/communication/gateway'),
    gateway_create: path(ROOTS_ADMIN, '/communication/gateway_create'),
  },

  report: {
    root: path(ROOTS_DASHBOARD, '/report'),
    list: path(ROOTS_ADMIN, '/report/list'),
    create: path(ROOTS_ADMIN, '/report/create'),
  },

  mail: {
    root: path(ROOTS_DASHBOARD, '/mail'),
    all: path(ROOTS_DASHBOARD, '/mail/all'),
  },
  chat: {
    root: path(ROOTS_DASHBOARD, '/chat'),
    new: path(ROOTS_DASHBOARD, '/chat/new'),
    view: (name: string) => path(ROOTS_DASHBOARD, `/chat/${name}`),
  },
  user: {
    root: path(ROOTS_DASHBOARD, '/user'),
    new: path(ROOTS_DASHBOARD, '/user/new'),
    list: path(ROOTS_DASHBOARD, '/user/list'),
    cards: path(ROOTS_DASHBOARD, '/user/cards'),
    profile: path(ROOTS_DASHBOARD, '/user/profile'),
    account: path(ROOTS_DASHBOARD, '/user/account'),
    edit: (name: string) => path(ROOTS_DASHBOARD, `/user/${name}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, `/user/reece-chung/edit`),
  },
  eCommerce: {
    root: path(ROOTS_DASHBOARD, '/e-commerce'),
    shop: path(ROOTS_DASHBOARD, '/e-commerce/shop'),
    list: path(ROOTS_DASHBOARD, '/e-commerce/list'),
    checkout: path(ROOTS_DASHBOARD, '/e-commerce/checkout'),
    new: path(ROOTS_DASHBOARD, '/e-commerce/product/new'),
    view: (name: string) => path(ROOTS_DASHBOARD, `/e-commerce/product/${name}`),
    edit: (name: string) => path(ROOTS_DASHBOARD, `/e-commerce/product/${name}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, '/e-commerce/product/nike-blazer-low-77-vintage/edit'),
    demoView: path(ROOTS_DASHBOARD, '/e-commerce/product/nike-air-force-1-ndestrukt'),
  },
  invoice: {
    root: path(ROOTS_DASHBOARD, '/invoice'),
    list: path(ROOTS_DASHBOARD, '/invoice/list'),
    new: path(ROOTS_DASHBOARD, '/invoice/new'),
    view: (id: string) => path(ROOTS_DASHBOARD, `/invoice/${id}`),
    edit: (id: string) => path(ROOTS_DASHBOARD, `/invoice/${id}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, '/invoice/e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1/edit'),
    demoView: path(ROOTS_DASHBOARD, '/invoice/e99f09a7-dd88-49d5-b1c8-1daf80c2d7b5'),
  },
  blog: {
    root: path(ROOTS_DASHBOARD, '/blog'),
    posts: path(ROOTS_DASHBOARD, '/blog/posts'),
    new: path(ROOTS_DASHBOARD, '/blog/new'),
    view: (title: string) => path(ROOTS_DASHBOARD, `/blog/post/${title}`),
    demoView: path(ROOTS_DASHBOARD, '/blog/post/apply-these-7-secret-techniques-to-improve-event'),
  },
};

export const PATH_DOCS = {
  root: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',
};

export const PATH_ZONE_ON_STORE = 'https://mui.com/store/items/zone-landing-page/';

export const PATH_MINIMAL_ON_STORE = 'https://mui.com/store/items/minimal-dashboard/';

export const PATH_FREE_VERSION = 'https://mui.com/store/items/minimal-dashboard-free/';

export const PATH_FIGMA_PREVIEW =
  'https://www.figma.com/file/rWMDOkMZYw2VpTdNuBBCvN/%5BPreview%5D-Minimal-Web.26.11.22?node-id=0%3A1&t=ya2mDFiuhTXXLLF1-1';
