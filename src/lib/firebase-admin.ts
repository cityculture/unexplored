import { getFirebaseAdminAuth } from './firebase/admin';

export const adminAuth = {
  verifyIdToken: async (idToken: string) => {
    const auth = getFirebaseAdminAuth();
    return auth.verifyIdToken(idToken);
  },
  getUser: async (uid: string) => {
    const auth = getFirebaseAdminAuth();
    return auth.getUser(uid);
  },
  createUser: async (properties: any) => {
    const auth = getFirebaseAdminAuth();
    return auth.createUser(properties);
  }
};

export default adminAuth;
