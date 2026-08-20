import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ExtractJwt } from 'passport-jwt';
import * as admin from 'firebase-admin';
import { EmpresasService } from '../../empresas/empresas.service';
import serviceAccount from '../../../firebase-service-account.json';

// Inicializar la app si no ha sido inicializada
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    projectId: 'quipu-2e7a3',
  });
}

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(
    private empresasService: EmpresasService,
  ) {
    super();
  }

  async validate(req: any): Promise<any> {

    const fn = ExtractJwt.fromAuthHeaderAsBearerToken();
    const token = fn(req);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      const uid = decodedUser.uid;

      // Consultar datos adicionales en Firestore
      const db = admin.firestore();
      const userDoc = await db.collection('usuarios').doc(uid).get();

      if (!userDoc.exists) {
        throw new UnauthorizedException('Usuario no configurado en el sistema (UID no encontrado en Firestore)');
      }

      const userData = userDoc.data();
      const rolId = userData?.idRol;
      const idEmpresa = userData?.idEmpresa;

      // Consultar permisos del rol
      let permisos: string[] = [];
      let roles: string[] = [];

      if (rolId) {
        const roleDoc = await db.collection('roles').doc(rolId).get();
        const roleData = roleDoc.data();
        // Validar que el rol pertenece a esta app
        if (roleData?.idApp === '1-Quipu') {
          if (roleData?.permisos && roleData.permisos.length > 0) {
            const permisosDoc = await db.collection('permisos')
              .where(admin.firestore.FieldPath.documentId(), 'in', roleData.permisos)
              .get();
            permisos = permisosDoc.docs.map(doc => doc.data().nombre || doc.id);
          }
          roles = [rolId];
        }
      }

      const empresa = await this.empresasService.findOne(idEmpresa);

      // Devolver un objeto de usuario enriquecido con Firestore y Firebase Auth
      return {
        id: uid, // Usamos UID como identificador principal
        firebaseUid: uid,
        nombreUsuario: decodedUser.email,
        email: decodedUser.email,
        idEmpresa: idEmpresa,
        nombreEmpresa: empresa?.nombre || null,
        roles: roles,
        permisos: permisos,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      console.error('Error en FirebaseStrategy:', e);
      throw new UnauthorizedException('Error al validar token de Firebase');
    }
  }
}
