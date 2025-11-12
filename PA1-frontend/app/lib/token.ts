import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

/*
 * Saves access and refresh tokens to AsyncStorage.
 */
export async function saveTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, accessToken],
    [REFRESH_KEY, refreshToken],
  ]);
}

/* Retrieves the access token from AsyncStorage.
 */
export async function getAccessToken() {
  const t = await AsyncStorage.getItem(ACCESS_KEY);
  // normalize empty-string to null so callers can detect absence
  if (t == null) return null;
  return t.length > 0 ? t : null;
}

/* Retrieves the refresh token from AsyncStorage.
 */
export async function getRefreshToken() {
  const t = await AsyncStorage.getItem(REFRESH_KEY);
  if (t == null) return null;
  return t.length > 0 ? t : null;
}

/* Clears both tokens from AsyncStorage.
 */
export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

/* Sets a new access token in AsyncStorage.
 */
export async function setAccessToken(newAccess: string) {
  await AsyncStorage.setItem(ACCESS_KEY, newAccess);
}