class BasicUtils {
  static isValidId(id) {
    return id && /^[a-fA-F0-9]{24}$/.test(id);
  }
}

export default BasicUtils;
